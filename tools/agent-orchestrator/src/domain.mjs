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

function sectionBody(body, label) {
  const escaped = escapeRegExp(label);
  const section = new RegExp(
    `(?:^|\\n)#{2,6}\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{2,6}\\s|(?![\\s\\S]))`,
    "im",
  );
  return body.match(section)?.[1] ?? "";
}

function pathPatternsFromSection(body, label) {
  const section = sectionBody(body, label);
  const codePatterns = [...section.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1].trim())
    .filter((value) => value.includes("/") || value.includes("*") || value.includes("."));
  if (codePatterns.length > 0) {
    return [...new Set(codePatterns.map(normalizePattern))];
  }

  const linePatterns = section
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter((line) => /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.*{}-]+)*\/?(?:\*{1,2})?$/.test(line));
  return [...new Set(linePatterns.map(normalizePattern))];
}

function normalizePattern(pattern) {
  const normalized = pattern.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\//, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    throw new Error(`Unsafe path pattern: ${pattern}`);
  }
  return normalized;
}

function normalizePath(filePath) {
  const normalized = filePath.replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\//, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) {
    throw new Error(`Unsafe changed path: ${filePath}`);
  }
  return normalized;
}

function patternRegExp(pattern) {
  if (pattern.endsWith("/**")) {
    const directory = escapeRegExp(pattern.slice(0, -3));
    return new RegExp(`^${directory}(?:/.*)?$`);
  }

  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    const next = pattern[index + 1];
    if (character === "*" && next === "*") {
      source += ".*";
      index += 1;
    } else if (character === "*") {
      source += "[^/]*";
    } else {
      source += escapeRegExp(character);
    }
  }
  return new RegExp(`^${source}$`);
}

export function pathMatchesPattern(filePath, pattern) {
  return patternRegExp(normalizePattern(pattern)).test(normalizePath(filePath));
}

export function validateChangedPaths(plan, paths) {
  const uniquePaths = [...new Set(paths.map(normalizePath))].sort();
  if (uniquePaths.length === 0) {
    throw new Error("The generated patch does not change any repository path.");
  }
  if (!Array.isArray(plan.allowedPaths) || plan.allowedPaths.length === 0) {
    throw new Error(`Issue #${plan.issueNumber} has no enforceable allowed paths.`);
  }

  const violations = uniquePaths.filter((filePath) => {
    const allowed = plan.allowedPaths.some((pattern) => pathMatchesPattern(filePath, pattern));
    const denied = (plan.forbiddenPaths ?? []).some((pattern) =>
      pathMatchesPattern(filePath, pattern),
    );
    return !allowed || denied;
  });

  if (violations.length > 0) {
    throw new Error(
      `Generated changes violate issue path scope: ${violations.join(", ")}. ` +
        `Allowed: ${plan.allowedPaths.join(", ") || "none"}; ` +
        `forbidden: ${(plan.forbiddenPaths ?? []).join(", ") || "none"}.`,
    );
  }
  return uniquePaths;
}

export function changedPathsFromPatch(patch) {
  if (typeof patch !== "string" || patch.trim().length === 0) {
    throw new Error("Generated result is missing a unified git patch.");
  }

  const paths = [];
  for (const line of patch.split("\n")) {
    if (!line.startsWith("diff --git ")) {
      continue;
    }
    const match = line.match(/^diff --git a\/([^\s]+) b\/([^\s]+)$/);
    if (!match) {
      throw new Error(`Unsupported or ambiguous patch path header: ${line}`);
    }
    const left = normalizePath(match[1]);
    const right = normalizePath(match[2]);
    if (left !== right) {
      paths.push(left, right);
    } else {
      paths.push(right);
    }
  }

  if (paths.length === 0) {
    throw new Error("Generated patch contains no diff --git path headers.");
  }
  return [...new Set(paths)].sort();
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
  const allowedPaths = pathPatternsFromSection(body, "Povolené oblasti");
  const forbiddenPaths = pathPatternsFromSection(body, "Zakázané oblasti");

  if (!baseSha) {
    throw new Error(`Issue #${issue.number} is missing a 40-character Base SHA.`);
  }
  if (!branch || branch.startsWith("-") || branch.endsWith("/")) {
    throw new Error(`Issue #${issue.number} has an invalid branch.`);
  }
  if (integrationOrderRaw === null) {
    throw new Error(`Issue #${issue.number} is missing Integrační pořadí.`);
  }
  if (allowedPaths.length === 0) {
    throw new Error(`Issue #${issue.number} has no machine-readable Povolené oblasti paths.`);
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
    allowedPaths,
    forbiddenPaths,
    requiredDocuments: REQUIRED_DOCUMENTS,
  });
}

export function inspectReadyIssues(issues) {
  const valid = [];
  const invalid = [];

  for (const issue of issues) {
    if (issue.pull_request || !labelsOf(issue).includes(STATUS.READY)) {
      continue;
    }
    try {
      valid.push(parseWorkPackage(issue));
    } catch (error) {
      invalid.push({
        issueNumber: issue.number,
        title: issue.title,
        error: error.message,
      });
    }
  }

  valid.sort(
    (left, right) =>
      left.integrationOrder - right.integrationOrder || left.issueNumber - right.issueNumber,
  );
  invalid.sort((left, right) => left.issueNumber - right.issueNumber);
  return Object.freeze({ selected: valid[0] ?? null, valid, invalid });
}

export function selectNextReadyIssue(issues) {
  return inspectReadyIssues(issues).selected;
}

export function replaceStatus(labels, nextStatus) {
  const statuses = new Set(Object.values(STATUS));
  return [...new Set([...labels.filter((label) => !statuses.has(label)), nextStatus])].sort();
}

export function buildAgentPrompt(plan, documentContents) {
  const documents = plan.requiredDocuments
    .map((documentPath) => {
      const content = documentContents[documentPath];
      if (typeof content !== "string" || content.length === 0) {
        throw new Error(`Missing authoritative document content: ${documentPath}`);
      }
      return `\n## BEGIN ${documentPath}\n${content}\n## END ${documentPath}`;
    })
    .join("\n");

  return `# Autonomous work package\n\nYou are the ${plan.role.id} specialist: ${plan.role.name}.\n${plan.role.mandate}\n\nRepository: $GITHUB_REPOSITORY\nIssue: #${plan.issueNumber} — ${plan.title}\nBase SHA: ${plan.baseSha}\nBranch baseline SHA: ${plan.branchHeadSha ?? plan.baseSha}\nRequired branch: ${plan.branch}\nIntegration order: ${plan.integrationOrder}\nAllowed paths: ${plan.allowedPaths.join(", ")}\nForbidden paths: ${plan.forbiddenPaths.join(", ") || "none beyond the allow-list"}\n\n## Non-negotiable execution rules\n- Work only on this issue and within its allowed paths.\n- Treat the issue and authoritative documents below as binding.\n- Do not merge, approve, push, label, comment, or call the GitHub API.\n- Do not modify docs/PROJECT_CONTROL.md unless it is explicitly allow-listed by this issue.\n- Do not include .agent-orchestrator/** control files in the patch.\n- Use the checked-out branch baseline; do not rebase, merge, commit, or rewrite Git history.\n- You may edit and test the isolated workspace to construct the solution. The workspace will be discarded after this job.\n- Your final response must be the schema-valid JSON object requested by the action.\n- For status completed, include a complete git binary patch produced from the baseline using git diff --binary --full-index and a complete HANDOFF.\n- For status blocked, use an empty patch and give a concrete blockedReason with the smallest required decision.\n- Never claim a check passed unless you actually ran it in this isolated job.\n\n## Issue body\n${plan.body}\n\n## Authoritative documents\n${documents}\n`;
}

export function handoffComment({ plan, prUrl, headSha, summary }) {
  return `<!-- agent-orchestrator:handoff issue=${plan.issueNumber} -->\n## HANDOFF — ${plan.role.id}\n\n- Issue: #${plan.issueNumber}\n- Base SHA: \`${plan.baseSha}\`\n- Branch baseline: \`${plan.branchHeadSha ?? plan.baseSha}\`\n- Branch: \`${plan.branch}\`\n- Head SHA: \`${headSha}\`\n- Draft PR: ${prUrl}\n- Integration order: ${plan.integrationOrder}\n\n${summary.trim()}\n\nThe orchestrator has not approved or merged this PR. A0 review remains mandatory.`;
}
