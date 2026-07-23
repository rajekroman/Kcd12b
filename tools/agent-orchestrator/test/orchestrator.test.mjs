import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";
import {
  buildAgentPrompt,
  changedPathsFromPatch,
  inspectReadyIssues,
  parseWorkPackage,
  replaceStatus,
  selectNextReadyIssue,
  validateChangedPaths,
  STATUS,
} from "../src/domain.mjs";
import { GitHubClient } from "../src/github.mjs";

const fixtures = JSON.parse(
  await fs.readFile(new URL("./fixtures/issues.json", import.meta.url), "utf8"),
);
const workflow = await fs.readFile(
  new URL("../../../.github/workflows/agent-orchestrator.yml", import.meta.url),
  "utf8",
);
const issueTemplate = await fs.readFile(
  new URL("../../../.github/ISSUE_TEMPLATE/agent-work-package.yml", import.meta.url),
  "utf8",
);

test("selectNextReadyIssue skips incomplete READY issues and keeps deterministic order", () => {
  const inspection = inspectReadyIssues(fixtures);
  assert.equal(inspection.selected.issueNumber, 40);
  assert.equal(inspection.selected.role.id, "A1");
  assert.equal(inspection.selected.branch, "agent/first-architecture");
  assert.deepEqual(
    inspection.invalid.map((entry) => entry.issueNumber),
    [38],
  );
  assert.equal(selectNextReadyIssue(fixtures).issueNumber, 40);
});

test("parseWorkPackage reads GitHub issue-form heading values and path contract", () => {
  const plan = parseWorkPackage({
    number: 42,
    title: "[A7] QA package",
    body:
      "### Base SHA\n\n4444444444444444444444444444444444444444\n\n" +
      "### Větev\n\nagent/qa-package\n\n" +
      "### Integrační pořadí\n\n2\n\n" +
      "### Povolené oblasti\n\n- `e2e/**`\n- `playwright.config.ts`\n\n" +
      "### Zakázané oblasti\n\n- `src/**`\n",
    labels: [{ name: "status:ready" }, { name: "agent:A7" }],
  });

  assert.equal(plan.baseSha, "4444444444444444444444444444444444444444");
  assert.equal(plan.branch, "agent/qa-package");
  assert.equal(plan.integrationOrder, 2);
  assert.equal(plan.role.id, "A7");
  assert.deepEqual(plan.allowedPaths, ["e2e/**", "playwright.config.ts"]);
  assert.deepEqual(plan.forbiddenPaths, ["src/**"]);
});

test("parseWorkPackage rejects ambiguous agent ownership", () => {
  const issue = {
    ...fixtures[1],
    labels: ["status:ready", "agent:A1", "agent:A2"],
  };
  assert.throws(() => parseWorkPackage(issue), /exactly one agent/);
});

test("path enforcement allows declared files and fails closed outside scope", () => {
  const plan = selectNextReadyIssue(fixtures);
  const patch =
    "diff --git a/tools/agent-orchestrator/src/a.mjs b/tools/agent-orchestrator/src/a.mjs\n" +
    "--- a/tools/agent-orchestrator/src/a.mjs\n" +
    "+++ b/tools/agent-orchestrator/src/a.mjs\n" +
    "@@ -0,0 +1 @@\n+export {};\n";
  const paths = changedPathsFromPatch(patch);
  assert.deepEqual(paths, ["tools/agent-orchestrator/src/a.mjs"]);
  assert.deepEqual(validateChangedPaths(plan, paths), paths);
  assert.throws(() => validateChangedPaths(plan, ["src/main.ts"]), /violate issue path scope/);
  assert.throws(
    () => changedPathsFromPatch("diff --git \"a/file with space\" \"b/file with space\"\n"),
    /Unsupported or ambiguous/,
  );
});

test("replaceStatus preserves non-status labels and sets exactly one state", () => {
  assert.deepEqual(
    replaceStatus(["agent:A1", "status:ready", "priority:P0"], STATUS.RUNNING),
    ["agent:A1", "priority:P0", "status:running"],
  );
});

test("buildAgentPrompt embeds authoritative documents and prohibits GitHub writes", () => {
  const plan = { ...selectNextReadyIssue(fixtures), branchHeadSha: "6".repeat(40) };
  const documents = Object.fromEntries(
    plan.requiredDocuments.map((file) => [file, `content:${file}`]),
  );
  const prompt = buildAgentPrompt(plan, documents);
  assert.match(prompt, /Do not merge, approve, push, label, comment, or call the GitHub API/);
  assert.match(prompt, /Branch baseline SHA: 6666666666666666666666666666666666666666/);
  assert.match(prompt, /git diff --binary --full-index/);
  for (const file of plan.requiredDocuments) {
    assert.match(prompt, new RegExp(`BEGIN ${file.replaceAll(".", "\\.")}`));
  }
});

test("workflow isolates Codex as the final generation step on a clean job boundary", () => {
  const generate = workflow.match(/\n {2}generate:\n([\s\S]*?)\n {2}finalize:\n/)?.[1] ?? "";
  const finalize = workflow.match(/\n {2}finalize:\n([\s\S]*?)\n {2}reconcile:\n/)?.[1] ?? "";
  const afterCodex = generate.split("uses: openai/codex-action@v1")[1] ?? "";

  assert.match(generate, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(generate, /GITHUB_TOKEN|contents: write|OPENAI_API_KEY:/);
  assert.doesNotMatch(afterCodex, /\n\s+- (?:name:|uses:|run:)/);
  assert.match(generate, /git merge-base --is-ancestor "\$BASE_SHA" HEAD/);
  assert.match(finalize, /needs: \[plan, generate\]/);
  assert.match(finalize, /Return unsuccessful package to BLOCKED/);
  assert.match(finalize, /> \/tmp\/BLOCKED\.md/);
  assert.match(finalize, /if \[\[ -f \/tmp\/BLOCKED\.md \]\]/);
  assert.doesNotMatch(finalize, /OPENAI_API_KEY|openai-api-key/);
  assert.match(workflow, /workflows: \["Test and deploy GitHub Pages"\]/);
  assert.doesNotMatch(workflow, /gh pr merge|\/merge(?:s|\b)|mergePullRequest/);
});

test("issue template requires role assignment before READY activation", () => {
  assert.doesNotMatch(issueTemplate, /^labels:/m);
  assert.match(issueTemplate, /Apply `status:ready` only as the final activation step/);
});

test("GitHubClient transitionStatus replaces READY with RUNNING", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (options.method === "PUT") {
      return new globalThis.Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new globalThis.Response(
      JSON.stringify({ labels: [{ name: "status:ready" }, { name: "agent:A1" }] }),
      { status: 200 },
    );
  };
  const client = new GitHubClient({
    repository: "example/game",
    token: "test-token",
    fetchImpl,
  });

  await client.transitionStatus(40, STATUS.RUNNING);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].options.method, "PUT");
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    labels: ["agent:A1", "status:running"],
  });
});
