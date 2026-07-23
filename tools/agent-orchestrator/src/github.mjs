import { Buffer } from "node:buffer";
import { replaceStatus, STATUS } from "./domain.mjs";

const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
  "stale",
  "startup_failure",
]);

export class GitHubClient {
  constructor({
    repository,
    token,
    apiUrl = "https://api.github.com",
    fetchImpl = globalThis.fetch,
  }) {
    if (!repository?.includes("/")) {
      throw new Error("GITHUB_REPOSITORY must use owner/name format.");
    }
    if (!token) {
      throw new Error("GITHUB_TOKEN is required for live orchestration.");
    }
    if (typeof fetchImpl !== "function") {
      throw new Error("A fetch implementation is required.");
    }
    this.repository = repository;
    this.token = token;
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
  }

  async request(path, options = {}) {
    const response = await this.fetchImpl(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const message = payload?.message ?? response.statusText;
      throw new Error(`GitHub API ${response.status} ${path}: ${message}`);
    }
    return payload;
  }

  repoPath(suffix) {
    return `/repos/${this.repository}${suffix}`;
  }

  async listIssuesByLabel(label) {
    return this.request(
      this.repoPath(`/issues?state=open&per_page=100&labels=${encodeURIComponent(label)}`),
    );
  }

  async getIssue(issueNumber) {
    return this.request(this.repoPath(`/issues/${issueNumber}`));
  }

  async setLabels(issueNumber, labels) {
    return this.request(this.repoPath(`/issues/${issueNumber}/labels`), {
      method: "PUT",
      body: JSON.stringify({ labels }),
    });
  }

  async transitionStatus(issueNumber, nextStatus) {
    const issue = await this.getIssue(issueNumber);
    const labels = (issue.labels ?? []).map((label) => label.name);
    await this.setLabels(issueNumber, replaceStatus(labels, nextStatus));
    return issue;
  }

  async addComment(issueNumber, body) {
    return this.request(this.repoPath(`/issues/${issueNumber}/comments`), {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  async listComments(issueNumber) {
    return this.request(this.repoPath(`/issues/${issueNumber}/comments?per_page=100`));
  }

  async addCommentOnce(issueNumber, marker, body) {
    const comments = await this.listComments(issueNumber);
    if (comments.some((comment) => comment.body?.includes(marker))) {
      return null;
    }
    return this.addComment(issueNumber, `${marker}\n${body}`);
  }

  async getContent(path, ref) {
    const encodedPath = encodeURIComponent(path).replaceAll("%2F", "/");
    const payload = await this.request(
      this.repoPath(`/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`),
    );
    if (payload.type !== "file" || payload.encoding !== "base64") {
      throw new Error(`Expected a base64 file for ${path}@${ref}.`);
    }
    return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
  }

  async branchExists(branch) {
    try {
      const encodedBranch = encodeURIComponent(branch).replaceAll("%2F", "/");
      await this.request(this.repoPath(`/git/ref/heads/${encodedBranch}`));
      return true;
    } catch (error) {
      if (String(error.message).includes("GitHub API 404")) {
        return false;
      }
      throw error;
    }
  }

  async ensureBranch(branch, baseSha) {
    if (await this.branchExists(branch)) {
      return { created: false };
    }
    await this.request(this.repoPath("/git/refs"), {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });
    return { created: true };
  }

  async findPullRequest(branch, state = "open") {
    const owner = this.repository.split("/")[0];
    const pulls = await this.request(
      this.repoPath(
        `/pulls?state=${state}&head=${encodeURIComponent(`${owner}:${branch}`)}&per_page=20`,
      ),
    );
    return pulls[0] ?? null;
  }

  async createDraftPullRequest({ title, body, head, base = "main" }) {
    const existing = await this.findPullRequest(head, "open");
    if (existing) {
      return existing;
    }
    return this.request(this.repoPath("/pulls"), {
      method: "POST",
      body: JSON.stringify({ title, body, head, base, draft: true }),
    });
  }

  async getCheckRuns(ref) {
    const payload = await this.request(
      this.repoPath(`/commits/${encodeURIComponent(ref)}/check-runs?per_page=100`),
      { headers: { Accept: "application/vnd.github+json" } },
    );
    return payload.check_runs ?? [];
  }

  async hasFailedChecks(ref) {
    const checks = await this.getCheckRuns(ref);
    return checks.some(
      (check) => check.status === "completed" && FAILURE_CONCLUSIONS.has(check.conclusion),
    );
  }

  async reconcileWorkPackage(plan, { now = Date.now(), staleHours = 6 } = {}) {
    const issue = await this.getIssue(plan.issueNumber);
    const labels = (issue.labels ?? []).map((label) => label.name);
    const pr = await this.findPullRequest(plan.branch, "all");

    if (labels.includes(STATUS.RUNNING)) {
      if (pr?.state === "open") {
        await this.transitionStatus(plan.issueNumber, STATUS.REVIEW);
        await this.addCommentOnce(
          plan.issueNumber,
          `<!-- agent-orchestrator:reconcile-pr issue=${plan.issueNumber} -->`,
          `Reconciler found open PR #${pr.number} for \`${plan.branch}\` and moved the issue to \`${STATUS.REVIEW}\`.`,
        );
        return "review";
      }

      const updatedAt = Date.parse(issue.updated_at);
      if (Number.isFinite(updatedAt) && now - updatedAt > staleHours * 60 * 60 * 1000) {
        await this.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
        await this.addCommentOnce(
          plan.issueNumber,
          `<!-- agent-orchestrator:orphan issue=${plan.issueNumber} -->`,
          `RUNNING lock became stale after ${staleHours} hours without an open PR. Manual A0 review is required before retry.`,
        );
        return "blocked";
      }
    }

    if (labels.includes(STATUS.REVIEW) && pr) {
      if (pr.state === "closed" && !pr.merged_at) {
        await this.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
        await this.addCommentOnce(
          plan.issueNumber,
          `<!-- agent-orchestrator:closed-pr issue=${plan.issueNumber} -->`,
          `PR #${pr.number} was closed without merge. The work package is blocked pending A0 disposition.`,
        );
        return "blocked";
      }
      if (pr.state === "open" && (await this.hasFailedChecks(pr.head.sha))) {
        await this.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
        await this.addCommentOnce(
          plan.issueNumber,
          `<!-- agent-orchestrator:ci-failed sha=${pr.head.sha} -->`,
          `Required checks failed for PR #${pr.number} at \`${pr.head.sha}\`. The orchestrator did not merge or retry the feature PR.`,
        );
        return "blocked";
      }
    }

    return "unchanged";
  }
}
