import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
  buildAgentPrompt,
  parseWorkPackage,
  replaceStatus,
  selectNextReadyIssue,
  STATUS,
} from "../src/domain.mjs";
import { GitHubClient } from "../src/github.mjs";

const fixtures = JSON.parse(
  await fs.readFile(new URL("./fixtures/issues.json", import.meta.url), "utf8"),
);

test("selectNextReadyIssue uses integration order and ignores RUNNING issues", () => {
  const plan = selectNextReadyIssue(fixtures);
  assert.equal(plan.issueNumber, 40);
  assert.equal(plan.role.id, "A1");
  assert.equal(plan.branch, "agent/first-architecture");
});

test("parseWorkPackage rejects ambiguous agent ownership", () => {
  const issue = {
    ...fixtures[0],
    labels: ["status:ready", "agent:A1", "agent:A2"],
  };
  assert.throws(() => parseWorkPackage(issue), /exactly one agent/);
});

test("replaceStatus preserves non-status labels and sets exactly one state", () => {
  assert.deepEqual(
    replaceStatus(["agent:A1", "status:ready", "priority:P0"], STATUS.RUNNING),
    ["agent:A1", "priority:P0", "status:running"],
  );
});

test("buildAgentPrompt embeds all authoritative documents and merge prohibition", () => {
  const plan = selectNextReadyIssue(fixtures);
  const documents = Object.fromEntries(
    plan.requiredDocuments.map((file) => [file, `content:${file}`]),
  );
  const prompt = buildAgentPrompt(plan, documents);
  assert.match(prompt, /Do not merge any pull request/);
  assert.match(prompt, /Base SHA: 2222222222222222222222222222222222222222/);
  for (const file of plan.requiredDocuments) {
    assert.match(prompt, new RegExp(`BEGIN ${file.replaceAll(".", "\\.")}`));
  }
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
