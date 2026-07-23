# Autonomous agent orchestration

This document defines the executable control plane for GitHub issue driven A0-A8 work packages. It supplements, and does not replace, `AGENTS.md`, `docs/PROJECT_CONTROL.md`, `docs/ARCHITECTURE_CONTRACT.md`, or `docs/DEFINITION_OF_DONE.md`.

## Safety model

- GitHub issues are the only work queue.
- A live package requires `status:ready` and exactly one `agent:A0` through `agent:A8` label.
- Every package must declare a 40-character Base SHA, dedicated branch, and numeric integration order.
- The workflow is serialized per repository through GitHub Actions concurrency. Under this lock the planner re-reads the issue immediately before replacing `status:ready` with `status:running`.
- Codex runs through `openai/codex-action@v1` in `workspace-write` with the default privilege reduction. The checkout does not persist GitHub credentials, so the coding agent cannot push, label, open, approve, or merge PRs.
- Only the post-agent workflow step receives `GITHUB_TOKEN` for commit push, draft PR creation, issue comments, and status labels.
- No code path calls the GitHub merge API. Every generated PR remains a draft until human A0 review.
- Repository secrets are never written to files or echoed by the orchestrator.

## Labels

Create these labels before the first live run:

- roles: `agent:A0`, `agent:A1`, `agent:A2`, `agent:A3`, `agent:A4`, `agent:A5`, `agent:A6`, `agent:A7`, `agent:A8`;
- states: `status:ready`, `status:running`, `status:review`, `status:blocked`.

Exactly one state label is retained by every orchestrator transition. Other labels, such as priority and subsystem labels, are preserved.

## Deterministic selection

`tools/agent-orchestrator/src/domain.mjs` filters open issues as follows:

1. excludes pull requests returned by the issues endpoint;
2. requires `status:ready`;
3. requires exactly one known agent label;
4. validates Base SHA, branch, and integration order;
5. sorts by integration order ascending, then issue number ascending;
6. selects exactly one issue.

A malformed READY issue fails safely instead of receiving guessed metadata.

## Live lifecycle

1. An authorized maintainer creates an issue from `agent-work-package.yml`, applies exactly one role label, and leaves `status:ready` in place.
2. `Agent Orchestrator` starts on the label event. Repository-wide concurrency prevents two queue consumers from running simultaneously.
3. The planner fetches authoritative documents at the issue's declared Base SHA, creates the branch if absent, rechecks READY, transitions it to RUNNING, and writes a lock comment linked to the Actions run.
4. The workflow verifies `OPENAI_API_KEY`, checks out the declared branch, and confirms that it descends from Base SHA.
5. The specialist receives the complete issue and authoritative documents. It may edit only the workspace and must produce `.agent-orchestrator/HANDOFF.md` or `.agent-orchestrator/BLOCKED.md`.
6. Required project checks run. On success, the workflow commits and pushes through a narrow post-agent step.
7. The control-plane adapter creates or reuses a draft PR, posts the HANDOFF, and moves the issue to `status:review`.
8. Any failure after lock acquisition moves the issue to `status:blocked` with a concrete reason. No PR is merged automatically.

## Reconciler

The hourly scheduled reconciler also runs after the configured quality workflow completes. It scans RUNNING and REVIEW packages:

- RUNNING with an open branch PR becomes REVIEW;
- RUNNING without an open PR for more than six hours becomes BLOCKED as an orphaned lock;
- REVIEW whose PR was closed without merge becomes BLOCKED;
- REVIEW whose current PR head has a failed check run becomes BLOCKED and receives a deduplicated CI comment.

The reconciler never retries generated code, rewrites a branch, approves, or merges.

## Required repository configuration

### Secret

Add repository secret `OPENAI_API_KEY` under **Settings → Secrets and variables → Actions**. The workflow passes it only to `openai/codex-action`. When missing, a live issue is safely returned to `status:blocked` and the reason is posted.

### Workflow permissions

Repository Actions settings must allow the workflow token to create branches and pull requests. The workflow declares only the permissions required by each job:

- orchestrate: `contents: write`, `issues: write`, `pull-requests: write`;
- reconcile: `contents: read`, `issues: write`, `pull-requests: read`, `checks: read`.

The agent process itself does not receive the GitHub token or persisted checkout credentials.

## Local deterministic smoke test

No OpenAI API key or GitHub token is required:

```bash
npm --prefix tools/agent-orchestrator test
npm --prefix tools/agent-orchestrator run dry-run
```

The dry-run fixture must always select issue `#40`, role `A1`, integration order `1`, and create only local `.agent-orchestrator/plan.json` and `prompt.md`. It performs no network or write action.

## Manual workflow dry-run

Run **Actions → Agent Orchestrator → Run workflow** with `dry_run=true`. This executes unit tests and fixture planning without labels, branch writes, API key, Codex, commits, or PR creation.

## Recovery

- To retry a valid blocked package, A0 resolves the documented cause and replaces `status:blocked` with `status:ready`.
- Do not manually add RUNNING; it represents an acquired workflow lock.
- If a branch no longer descends from the declared Base SHA, update the issue through an explicit coordination decision rather than force-pushing.
- To disable autonomous starts while preserving audit history, disable the workflow. Existing branches, draft PRs, issue comments, and labels remain intact.
