#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildAgentPrompt,
  changedPathsFromPatch,
  handoffComment,
  inspectReadyIssues,
  parseWorkPackage,
  validateChangedPaths,
  STATUS,
} from "./domain.mjs";
import { GitHubClient } from "./github.mjs";

function hasFlag(name) {
  return process.argv.includes(name);
}

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function writeOutput(values) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    return;
  }
  const lines = Object.entries(values).map(([key, value]) => `${key}=${String(value)}`);
  await fs.appendFile(outputFile, `${lines.join("\n")}\n`, "utf8");
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function clientFromEnv() {
  return new GitHubClient({
    repository: process.env.GITHUB_REPOSITORY,
    token: process.env.GITHUB_TOKEN,
    apiUrl: process.env.GITHUB_API_URL,
  });
}

async function loadFixture(filePath) {
  const payload = await readJson(filePath);
  if (!Array.isArray(payload)) {
    throw new Error("Fixture must contain an array of GitHub issue objects.");
  }
  return payload;
}

async function blockInvalidReadyIssues(client, invalidIssues) {
  for (const invalid of invalidIssues) {
    try {
      await client.transitionStatus(invalid.issueNumber, STATUS.BLOCKED);
      await client.addCommentOnce(
        invalid.issueNumber,
        `<!-- agent-orchestrator:invalid-ready issue=${invalid.issueNumber} -->`,
        `READY work package was rejected without stopping the remaining queue: ${invalid.error}`,
      );
    } catch (error) {
      console.error(
        `Failed to mark invalid READY issue #${invalid.issueNumber} as blocked; continuing queue selection: ${error.message}`,
      );
    }
  }
}

async function planCommand() {
  const dryRun = hasFlag("--dry-run");
  const lock = hasFlag("--lock");
  const fixture = option("--fixture");
  const planFile = option("--plan-file", ".agent-orchestrator/plan.json");
  const promptFile = option("--prompt-file", ".agent-orchestrator/prompt.md");

  if (lock && dryRun) {
    throw new Error("--lock cannot be combined with --dry-run.");
  }

  const client = dryRun && fixture ? null : clientFromEnv();
  const issues = fixture ? await loadFixture(fixture) : await client.listIssuesByLabel(STATUS.READY);
  const inspection = inspectReadyIssues(issues);

  if (client && lock && inspection.invalid.length > 0) {
    await blockInvalidReadyIssues(client, inspection.invalid);
  }

  let plan = inspection.selected;
  if (!plan) {
    console.log(
      JSON.stringify(
        {
          shouldRun: false,
          reason: "No valid READY issue.",
          invalid: inspection.invalid,
        },
        null,
        2,
      ),
    );
    await writeOutput({ should_run: "false", dry_run: String(dryRun) });
    return;
  }

  if (lock) {
    const currentIssue = await client.getIssue(plan.issueNumber);
    const currentLabels = (currentIssue.labels ?? []).map((label) => label.name);
    if (!currentLabels.includes(STATUS.READY)) {
      throw new Error(`Issue #${plan.issueNumber} lost ${STATUS.READY} before lock acquisition.`);
    }

    plan = parseWorkPackage(currentIssue);
    const branch = await client.ensureBranch(plan.branch, plan.baseSha);
    plan = Object.freeze({ ...plan, branchHeadSha: branch.sha });
    await writeJson(planFile, plan);

    try {
      await client.transitionStatus(plan.issueNumber, STATUS.RUNNING);
      const runUrl =
        process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : "local live run";
      await client.addComment(
        plan.issueNumber,
        `<!-- agent-orchestrator:lock run=${process.env.GITHUB_RUN_ID ?? "local"} -->\n` +
          `Orchestrator acquired the repository-serialized lock and moved this work package to \`${STATUS.RUNNING}\`.\n\n` +
          `- Role: ${plan.role.id}\n- Base: \`${plan.baseSha}\`\n- Branch baseline: \`${plan.branchHeadSha}\`\n- Branch: \`${plan.branch}\`\n- Run: ${runUrl}`,
      );
    } catch (error) {
      await client.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
      await client.addCommentOnce(
        plan.issueNumber,
        `<!-- agent-orchestrator:lock-failed run=${process.env.GITHUB_RUN_ID ?? "local"} -->`,
        `Lock acquisition failed safely: ${error.message}`,
      );
      throw error;
    }
  } else {
    plan = Object.freeze({ ...plan, branchHeadSha: plan.baseSha });
    await writeJson(planFile, plan);
  }

  try {
    let documentContents;
    if (client) {
      const entries = await Promise.all(
        plan.requiredDocuments.map(async (documentPath) => [
          documentPath,
          await client.getContent(documentPath, plan.baseSha),
        ]),
      );
      documentContents = Object.fromEntries(entries);
    } else {
      documentContents = Object.fromEntries(
        plan.requiredDocuments.map((documentPath) => [
          documentPath,
          `[dry-run placeholder for ${documentPath}@${plan.baseSha}]`,
        ]),
      );
    }

    const prompt = buildAgentPrompt(plan, documentContents);
    await fs.mkdir(path.dirname(promptFile), { recursive: true });
    await fs.writeFile(promptFile, prompt, "utf8");
  } catch (error) {
    if (client && lock) {
      await client.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
      await client.addCommentOnce(
        plan.issueNumber,
        `<!-- agent-orchestrator:prompt-failed run=${process.env.GITHUB_RUN_ID ?? "local"} -->`,
        `The work package was locked but authoritative prompt assembly failed: ${error.message}`,
      );
    }
    throw error;
  }

  const output = {
    shouldRun: true,
    dryRun,
    locked: lock,
    issueNumber: plan.issueNumber,
    title: plan.title,
    role: plan.role.id,
    baseSha: plan.baseSha,
    branchHeadSha: plan.branchHeadSha,
    branch: plan.branch,
    integrationOrder: plan.integrationOrder,
    planFile,
    promptFile,
    invalid: inspection.invalid,
  };
  console.log(JSON.stringify(output, null, 2));
  await writeOutput({
    should_run: "true",
    dry_run: String(dryRun),
    issue_number: plan.issueNumber,
    issue_title: plan.title.replaceAll("\n", " "),
    role: plan.role.id,
    base_sha: plan.baseSha,
    branch_head_sha: plan.branchHeadSha,
    branch: plan.branch,
    integration_order: plan.integrationOrder,
    plan_file: planFile,
    prompt_file: promptFile,
  });
}

async function materializeCommand() {
  const planFile = option("--plan-file", ".agent-orchestrator/plan.json");
  const resultFile = option("--result-file", ".agent-orchestrator/result.json");
  const patchFile = option("--patch-file", ".agent-orchestrator/generated.patch");
  const handoffFile = option("--handoff-file", ".agent-orchestrator/HANDOFF.md");
  const blockedFile = option("--blocked-file", ".agent-orchestrator/BLOCKED.md");
  const plan = await readJson(planFile);

  try {
    const result = await readJson(resultFile);
    if (result.status === "blocked") {
      throw new Error(
        String(result.blockedReason ?? "Agent returned blocked without a reason.").trim(),
      );
    }
    if (result.status !== "completed") {
      throw new Error(`Unsupported agent result status: ${String(result.status)}`);
    }

    const patch = String(result.patch ?? "");
    const handoff = String(result.handoff ?? "").trim();
    if (!handoff) {
      throw new Error("Completed agent result is missing HANDOFF content.");
    }

    const patchPaths = changedPathsFromPatch(patch);
    const validatedPaths = validateChangedPaths(plan, patchPaths);
    await fs.mkdir(path.dirname(patchFile), { recursive: true });
    await fs.writeFile(patchFile, patch, "utf8");
    await fs.mkdir(path.dirname(handoffFile), { recursive: true });
    await fs.writeFile(handoffFile, `${handoff}\n`, "utf8");
    console.log(JSON.stringify({ status: "completed", paths: validatedPaths }, null, 2));
    await writeOutput({ materialized: "true", changed_paths: validatedPaths.join(",") });
  } catch (error) {
    await fs.mkdir(path.dirname(blockedFile), { recursive: true });
    await fs.writeFile(blockedFile, `${error.message}\n`, "utf8");
    throw error;
  }
}

async function validatePathsCommand() {
  const planFile = option("--plan-file", ".agent-orchestrator/plan.json");
  const pathsFile = option("--paths-file");
  if (!pathsFile) {
    throw new Error("validate-paths requires --paths-file.");
  }
  const plan = await readJson(planFile);
  const paths = (await fs.readFile(pathsFile, "utf8"))
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const validated = validateChangedPaths(plan, paths);
  console.log(JSON.stringify({ valid: true, paths: validated }, null, 2));
}

async function finalizeCommand() {
  const planFile = option("--plan-file", ".agent-orchestrator/plan.json");
  const summaryFile = option("--summary-file", ".agent-orchestrator/HANDOFF.md");
  const headSha = option("--head-sha") ?? process.env.HEAD_SHA;
  if (!headSha) {
    throw new Error("finalize requires --head-sha or HEAD_SHA.");
  }

  const plan = await readJson(planFile);
  const summary = await fs.readFile(summaryFile, "utf8");
  const client = clientFromEnv();
  const pr = await client.createDraftPullRequest({
    title: `[${plan.role.id}] ${plan.title.replace(/^\[[^\]]+\]\s*/, "")}`,
    body:
      `Closes #${plan.issueNumber}\n\n` +
      `Automated draft created from issue #${plan.issueNumber}. A0 approval and merge are mandatory.\n\n` +
      summary,
    head: plan.branch,
    base: "main",
  });

  await client.transitionStatus(plan.issueNumber, STATUS.REVIEW);
  await client.addComment(
    plan.issueNumber,
    handoffComment({
      plan,
      prUrl: pr.html_url,
      headSha,
      summary,
    }),
  );
  console.log(JSON.stringify({ status: STATUS.REVIEW, pr: pr.html_url, headSha }, null, 2));
}

async function blockCommand() {
  const planFile = option("--plan-file", ".agent-orchestrator/plan.json");
  const reasonFile = option("--reason-file", ".agent-orchestrator/BLOCKED.md");
  const fallbackReason = option("--reason", "Orchestrator run failed before a complete HANDOFF.");
  const plan = await readJson(planFile);
  let reason = fallbackReason;
  try {
    reason = await fs.readFile(reasonFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const client = clientFromEnv();
  await client.transitionStatus(plan.issueNumber, STATUS.BLOCKED);
  await client.addCommentOnce(
    plan.issueNumber,
    `<!-- agent-orchestrator:blocked run=${process.env.GITHUB_RUN_ID ?? "local"} -->`,
    `## Orchestrator blocked\n\n${reason.trim()}\n\nNo feature PR was merged. A0 must decide whether to retry or respecify the issue.`,
  );
  console.log(JSON.stringify({ status: STATUS.BLOCKED, reason: reason.trim() }, null, 2));
}

async function reconcileCommand() {
  const client = clientFromEnv();
  const staleHours = Number(option("--stale-hours", "6"));
  const running = await client.listIssuesByLabel(STATUS.RUNNING);
  const review = await client.listIssuesByLabel(STATUS.REVIEW);
  const unique = new Map([...running, ...review].map((issue) => [issue.number, issue]));
  const results = [];

  for (const issue of [...unique.values()].sort((left, right) => left.number - right.number)) {
    try {
      const plan = parseWorkPackage(issue);
      const result = await client.reconcileWorkPackage(plan, { staleHours });
      results.push({ issue: issue.number, result });
    } catch (error) {
      await client.transitionStatus(issue.number, STATUS.BLOCKED);
      await client.addCommentOnce(
        issue.number,
        `<!-- agent-orchestrator:invalid-contract issue=${issue.number} -->`,
        `Reconciler could not parse the work-package contract: ${error.message}`,
      );
      results.push({ issue: issue.number, result: "blocked-invalid-contract" });
    }
  }

  console.log(JSON.stringify({ reconciled: results }, null, 2));
}

async function main() {
  const command = process.argv[2];
  switch (command) {
    case "plan":
      await planCommand();
      break;
    case "materialize":
      await materializeCommand();
      break;
    case "validate-paths":
      await validatePathsCommand();
      break;
    case "finalize":
      await finalizeCommand();
      break;
    case "block":
      await blockCommand();
      break;
    case "reconcile":
      await reconcileCommand();
      break;
    default:
      throw new Error(
        "Usage: cli.mjs <plan|materialize|validate-paths|finalize|block|reconcile> [options]",
      );
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
