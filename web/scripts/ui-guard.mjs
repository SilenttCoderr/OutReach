import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Lightweight style guard for known token-bypass regressions from Phase 02.1 revamp.
 *
 * Update `RULES` when the design contract changes.
 * Each rule can target specific files and regex patterns.
 */
const RULES = [
  {
    name: "No hardcoded auth error utility colors",
    files: ["src/app/login/page.tsx", "src/app/signup/page.tsx"],
    pattern: /text-red-(?:[0-9]{2,3})|bg-red-(?:[0-9]{2,3})(?:\/[0-9]{1,3})?/g,
    guidance: "Use tokenized status classes/components (e.g., StatusBanner with text-error/bg-error semantics).",
  },
  {
    name: "No hardcoded provider button shell colors",
    files: ["src/app/login/page.tsx", "src/app/signup/page.tsx"],
    pattern: /bg-white\s+text-black|hover:bg-gray-100/g,
    guidance: "Use shared token-aligned provider button styling (btn-provider).",
  },
  {
    name: "No reviewed arbitrary spacing outliers",
    files: [
      "src/app/dashboard/page.tsx",
      "src/app/dashboard/profile/page.tsx",
      "src/app/dashboard/templates/page.tsx",
    ],
    pattern: /max-w-\[200px\]|min-h-\[120px\]|min-h-\[100px\]/g,
    guidance: "Replace with scale utilities (e.g., max-w-48, min-h-32, min-h-28).",
  },
];

function getLineNumber(content, index) {
  const upToMatch = content.slice(0, index);
  return upToMatch.split("\n").length;
}

async function scanRule(rule) {
  const issues = [];

  for (const relativeFile of rule.files) {
    const fullPath = path.join(process.cwd(), relativeFile);
    const content = await readFile(fullPath, "utf8");
    const matches = content.matchAll(rule.pattern);

    for (const match of matches) {
      const matchIndex = match.index ?? 0;
      issues.push({
        file: relativeFile,
        line: getLineNumber(content, matchIndex),
        value: match[0],
        rule: rule.name,
        guidance: rule.guidance,
      });
    }
  }

  return issues;
}

async function main() {
  const violations = [];

  for (const rule of RULES) {
    const issues = await scanRule(rule);
    violations.push(...issues);
  }

  if (violations.length === 0) {
    console.log("ui:guard passed - no forbidden style patterns found.");
    process.exit(0);
  }

  console.error("ui:guard failed - forbidden style patterns detected:\n");

  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} | ${violation.rule} | ${violation.value}`,
    );
    console.error(`  -> ${violation.guidance}`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error("ui:guard encountered an unexpected error:", error);
  process.exit(1);
});
