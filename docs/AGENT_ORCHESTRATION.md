# Autonomous agent orchestration

This document defines the executable control plane for GitHub issue-driven A0-A8 work packages. It supplements, and does not replace, `AGENTS.md`, `docs/PROJECT_CONTROL.md`, `docs/ARCHITECTURE_CONTRACT.md`, or `docs/DEFINITION_OF_DONE.md`.

## Safety model

- GitHub issues are the only work queue.
- A live package requires `status:ready` and exactly one `agent:A0` through `agent:A8` label.
- Every package must declare a 40-character Base SHA, a dedicated branch, numeric integration order, and a machine-readable allow-list under `Povolené oblasti`.
- `status:ready` is applied only after the role label, scope, dependencies, and path contract are complete.
- Repository-wide concurrency serializes queue consumers. Under that lock, the planner re-reads the selected issue immediately before replacing `status:ready` with `status:running`.
- Malformed READY issues are moved to `status:blocked` with a deduplicated reason and do not prevent the next valid package from being selected.
- Codex runs through `openai/codex-action@v1` in a dedicated generation job with `contents: read`, `persist-credentials: false`, and no `GITHUB_TOKEN` environment variable.
- The Codex action is the final step on its runner. That runner is discarded after returning a schema-validated patch and HANDOFF as the job output.
- A new clean runner parses the result, enforces the allow/deny path contract before applying the patch, verifies the actual changed paths again, runs all required checks, and only then commits and pushes.
- The clean finalizer receives no `OPENAI_API_KEY`. GitHub write credentials are scoped only to the individual lock, push, PR, comment, and status-transition steps that require them.
- No code path calls a GitHub merge API. Every generated PR remains a draft until A0 review.
- Repository secrets are never written to files or echoed by the orchestrator.

## Labels

Create these labels before the first live run:

- roles: `agent:A0`, `agent:A1`, `agent:A2`, `agent:A3`, `agent:A4`, `agent:A5`, `agent:A6`, `agent:A7`, `agent:A8`;
- states: `status:ready`, `status:running`, `status:review`, `status:blocked`.

Exactly one state label is retained by every orchestrator transition. Priority and subsystem labels are preserved.

## Work-package path contract

The issue form requires one backtick-wrapped repository path or glob per bullet under `Povolené oblasti`. `Zakázané oblasti` is an optional additional deny-list. Deny rules win.

Supported deterministic patterns include:

- exact files such as `playwright.config.ts`;
- single-segment wildcards such as `vite.config.*`;
- recursive trees such as `src/application/**`.

The generated result must contain ordinary unquoted Git patch path headers. Ambiguous paths, traversal, unsupported quoted paths, an empty change set, or any path outside the allow-list fail closed and move the issue to BLOCKED.

## Deterministic selection

`tools/agent-orchestrator/src/domain.mjs` processes open READY issues as follows:

1. excludes pull requests returned by the issues endpoint;
2. validates exactly one known agent label;
3. validates Base SHA, branch, integration order, and allowed paths;
4. records malformed issues without stopping valid candidates;
5. sorts valid candidates by integration order ascending, then issue number ascending;
6. selects exactly one work package.

## Live lifecycle

1. A maintainer creates an issue from `agent-work-package.yml`.
2. The maintainer applies exactly one role label, verifies the full contract, and applies `status:ready` last.
3. The planner acquires the repository-wide concurrency lock, blocks malformed READY entries, re-reads the selected issue, creates or reuses its branch, records the immutable branch-head SHA, and transitions the issue to RUNNING.
4. The planner fetches the authoritative documents at the declared Base SHA and uploads the immutable plan, prompt, and control-plane code as a one-day artifact.
5. The isolated generation job checks out the recorded branch baseline, installs required dependencies, and runs Codex as its final step. Codex returns a schema-valid `completed` or `blocked` result.
6. The clean finalizer downloads the immutable plan, checks the patch paths before application, verifies that the branch head has not moved, applies the patch, re-checks the actual working-tree paths, and runs lint, typecheck, unit tests, build, and E2E.
7. Only validated changes are committed and pushed. The adapter creates or refreshes a draft PR, publishes the HANDOFF, and transitions the issue to `status:review`.
8. Generation failure, blocked output, path violation, baseline race, failed validation, push failure, or PR publication failure transitions the issue to `status:blocked` with a concrete reason. No PR is merged automatically.

## Reconciler

The hourly reconciler also runs after the `Test and deploy GitHub Pages` workflow completes. It scans RUNNING and REVIEW packages:

- RUNNING with an open branch PR becomes REVIEW;
- RUNNING without an open PR for more than six hours becomes BLOCKED as an orphaned lock;
- REVIEW whose PR was closed without merge becomes BLOCKED;
- REVIEW whose current PR head has a failed check run becomes BLOCKED and receives a deduplicated CI comment.

The reconciler never retries generated code, rewrites a branch, approves, or merges.

## Required repository configuration

### Secret

Add repository secret `OPENAI_API_KEY` under **Settings → Secrets and variables → Actions**. It is passed only to the final step of the isolated generation job. When the action cannot use the secret, the clean finalizer records the failure and returns the issue to `status:blocked`.

### Workflow permissions

Repository Actions settings must allow the workflow token to create branches and draft pull requests. Job permissions are intentionally separated:

- `verify`: `contents: read`;
- `plan`: `contents: write`, `issues: write`, `pull-requests: read`;
- `generate`: `contents: read` only;
- `finalize`: `contents: write`, `issues: write`, `pull-requests: write`;
- `reconcile`: `contents: read`, `issues: write`, `pull-requests: read`, `checks: read`.

The generation process does not receive a GitHub write token or persisted checkout credentials.

## Local deterministic smoke test

No OpenAI API key or GitHub token is required:

```bash
npm --prefix tools/agent-orchestrator test
npm --prefix tools/agent-orchestrator run dry-run
```

The fixture deliberately contains an incomplete READY issue. The test must still select issue `#40`, role `A1`, integration order `1`, while reporting the incomplete issue separately. Dry-run creates only local `.agent-orchestrator/plan.json` and `prompt.md` and performs no network or repository write action.

## Pull-request verification

Changes to the orchestrator workflow, issue form, documentation, or tool automatically run the read-only `verify` job. It executes the Node unit tests and deterministic dry-run in addition to the repository's normal quality workflow.

## Manual workflow dry-run

Run **Actions → Agent Orchestrator → Run workflow** with `dry_run=true`. This executes fixture planning without labels, branch writes, API key, Codex, commits, or PR creation.

## Known limits

- The isolated runner transfers generated work through the Codex job output. GitHub job-output limits therefore bound the maximum patch size; oversized packages must be split into smaller issues.
- Patch paths containing spaces or Git's quoted-path syntax are rejected rather than interpreted ambiguously.
- Binary patches are accepted only when they fit the output limit and use a standard `git diff --binary --full-index` representation.
- The first live run still depends on a valid external `OPENAI_API_KEY` and the documented labels being present.

## Recovery

- To retry a valid blocked package, A0 resolves the documented cause and replaces `status:blocked` with `status:ready`.
- Do not manually add RUNNING; it represents an acquired workflow lock.
- If a branch moved after planning, do not force-push. A0 must decide whether to update the issue contract or create a new work package.
- To disable autonomous starts while preserving audit history, disable the workflow. Existing branches, draft PRs, comments, and labels remain intact.
