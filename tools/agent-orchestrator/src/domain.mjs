export const STATUS = Object.freeze({
  READY: "status:ready",
  RUNNING: "status:running",
  REVIEW: "status:review",
  BLOCKED: "status:blocked",
});

export const ROLE_DEFINITIONS = Object.freeze({
  "agent:A0": {
    id: "A0",
    name: "Koordinace a integrace",
    mandate: "Řiď integrační pořadí, review, merge gate a PROJECT_CONTROL. Neimplementuj feature logiku.",
  },
  "agent:A1": {
    id: "A1",
    name: "Architektura a platforma",
    mandate: "Udržuj vrstvy, platformní adaptéry, build, persistence, asset runtime a technické ADR.",
  },
  "agent:A2": {
    id: "A2",
    name: "Gameplay a herní systémy",
    mandate: "Implementuj čisté deterministické gameplay systémy a jejich aplikační integraci.",
  },
  "agent:A3": {
    id: "A3",
    name: "Svět, questy a obsah",
    mandate: "Spravuj datově řízený svět, questy, dialogy, NPC a obsahové kontrakty.",
  },
  "agent:A4": {
    id: "A4",
    name: "Grafika, animace a vizuální design",
    mandate: "Spravuj vizuální jazyk, assety, atlasy, animace a výkonovou čitelnost.",
  },
  "agent:A5": {
    id: "A5",
    name: "UI, UX a mobilní ovládání",
    mandate: "Spravuj HUD, panely, input priority, safe-area a portrait/landscape použitelnost.",
  },
  "agent:A6": {
    id: "A6",
    name: "Zvuk, hudba a atmosféra",
    mandate: "Spravuj audio lifecycle, mixer, hudební stavy, SFX a mobilní autoplay omezení.",
  },
  "agent:A7": {
    id: "A7",
    name: "QA, testování a výkon",
    mandate: "Reprodukuj chyby, vytvářej deterministické testy a nezávisle ověřuj CI a výkon.",
  },
  "agent:A8": {
    id: "A8",
    name: "Release, dokumentace a nasazení",
    mandate: "Spravuj release gate, dokumentaci, artefakty, GitHub Pages, PWA a produkční smoke test.",
  },
});

const REQUIRED_DOCUMENTS = Object.freeze([
  "AGENTS.md",
  "docs/PROJECT_CONTROL.md",
  "docs/ARCHITECTURE_CONTRACT.md",
  "docs/DEFINITION_OF_DONE.md",
]);

function labelsOf(issue) {
  return (issue.labels ?? []).map((label) =>
    typeof label === "string" ? label : label.name,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchField(body, label, pattern) {
  const escaped = escapeRegExp(label);
  const inline = new RegExp(
    `(?:^|\\n)\\s*[-*]?\\s*${escaped}\\s*:\\s*${pattern}`,
    "im",
  );
  const heading = new RegExp(
    `(?:^|\\n)#{2,6}\\s*${escaped}\\s*\\n+(?:\\s*\\n)*\\s*${pattern}`,
    "im",
  );
  return body.match(inline)?.[1]?.trim() ?? body.match(heading)?.[1]?.trim() ?? null;
}

export function parseWorkPackage(issue) {
  const body = issue.body ?? "";
  const labels = labelsOf(issue);
  const agentLabels = labels.filter((label) => ROLE_DEFINITIONS[label]);

  if (agentLabels.length !== 1) {
    throw new Error(
      `Issue #${issue.number} must have exactly one agent:A0..A8 label; found ${agentLabels.length}.`,
    );
  }

  const baseSha = matchField(body, "Base SHA", "`?([0-9a-f]{40})`?");
  const branch = matchField(body, "Větev", "`?([A-Za-z0-9._/-]+)`?");
  const integrationOrderRaw = matchField(body, "Integrační pořadí", "([0-9]+)");

  if (!baseSha) {
    throw new Error(`Issue #${issue.number} is missing a 40-character Base SHA.`);
  }
  if (!branch || branch.startsWith("-") || branch.endsWith("/")) {
    throw new Error(`Issue #${issue.number} has an invalid branch.`);
  }
  if (integrationOrderRaw === null) {
    throw new Error(`Issue #${issue.number} is missing Integrační pořadí.`);
  }

  const agentLabel = agentLabels[0];
  return Object.freeze({
    issueNumber: issue.number,
    title: issue.title,
    body,
    htmlUrl: issue.html_url ?? issue.url ?? "",
    updatedAt: issue.updated_at ?? null,
    labels,
    agentLabel,
    role: ROLE_DEFINITIONS[agentLabel],
    baseSha,
    branch,
    integrationOrder: Number(integrationOrderRaw),
    requiredDocuments: REQUIRED_DOCUMENTS,
  });
}

export function selectNextReadyIssue(issues) {
  const candidates = issues
    .filter((issue) => !issue.pull_request)
    .filter((issue) => labelsOf(issue).includes(STATUS.READY))
    .map(parseWorkPackage)
    .sort(
      (left, right) =>
        left.integrationOrder - right.integrationOrder ||
        left.issueNumber - right.issueNumber,
    );

  return candidates[0] ?? null;
}

export function replaceStatus(labels, nextStatus) {
  const statuses = new Set(Object.values(STATUS));
  return [...new Set([...labels.filter((label) => !statuses.has(label)), nextStatus])].sort();
}

export function buildAgentPrompt(plan, documentContents) {
  const documents = plan.requiredDocuments
    .map((path) => {
      const content = documentContents[path];
      if (typeof content !== "string" || content.length === 0) {
        throw new Error(`Missing authoritative document content: ${path}`);
      }
      return `\n## BEGIN ${path}\n${content}\n## END ${path}`;
    })
    .join("\n");

  return `# Autonomous work package\n\nYou are the ${plan.role.id} specialist: ${plan.role.name}.\n${plan.role.mandate}\n\nRepository: $GITHUB_REPOSITORY\nIssue: #${plan.issueNumber} — ${plan.title}\nBase SHA: ${plan.baseSha}\nRequired branch: ${plan.branch}\nIntegration order: ${plan.integrationOrder}\n\n## Non-negotiable execution rules\n- Work only on this issue and within its allowed paths.\n- Treat the issue and authoritative documents below as binding.\n- Do not merge any pull request.\n- Do not modify docs/PROJECT_CONTROL.md unless the issue explicitly allows it.\n- Keep the branch based on the stated Base SHA; do not silently rebase to another base.\n- Run the relevant checks and leave the repository in a commit-ready state.\n- Write a complete HANDOFF to .agent-orchestrator/HANDOFF.md with changed files, checks, risks, rollback, known limits, base SHA and resulting head SHA placeholder.\n- When blocked, do not invent a workaround outside scope. Write .agent-orchestrator/BLOCKED.md with the concrete cause and smallest required decision.\n\n## Issue body\n${plan.body}\n\n## Authoritative documents\n${documents}\n`;
}

export function handoffComment({ plan, prUrl, headSha, summary }) {
  return `<!-- agent-orchestrator:handoff issue=${plan.issueNumber} -->\n## HANDOFF — ${plan.role.id}\n\n- Issue: #${plan.issueNumber}\n- Base SHA: \`${plan.baseSha}\`\n- Branch: \`${plan.branch}\`\n- Head SHA: \`${headSha}\`\n- Draft PR: ${prUrl}\n- Integration order: ${plan.integrationOrder}\n\n${summary.trim()}\n\nThe orchestrator has not approved or merged this PR. A0 review remains mandatory.`;
}
