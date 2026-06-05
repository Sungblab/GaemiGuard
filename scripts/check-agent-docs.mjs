import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "docs/agent-index.md",
  "docs/development-status.md",
  "docs/development-history.md",
  "docs/README.md",
  "docs/architecture/design-index.md",
  "docs/architecture/maps/README.md",
  "docs/contributing/workflow.md",
  "docs/handoffs/README.md",
  "docs/stages/stage-2-toss-readonly-connector.md",
  ".devflow/config.json"
];

const requiredMentions = [
  {
    file: "AGENTS.md",
    text: "docs/agent-index.md"
  },
  {
    file: "docs/README.md",
    text: "docs/agent-index.md"
  },
  {
    file: "docs/README.md",
    text: "docs/development-history.md"
  },
  {
    file: "docs/development-status.md",
    text: "docs/agent-index.md"
  },
  {
    file: "docs/architecture/design-index.md",
    text: "docs/development-history.md"
  },
  {
    file: "docs/contributing/workflow.md",
    text: "pnpm docs:agent-check"
  },
  {
    file: "docs/testing/strategy.md",
    text: "pnpm docs:agent-check"
  },
  {
    file: ".devflow/config.json",
    text: "docs:agent-check"
  }
];

const errors = [];

for (const relativePath of requiredFiles) {
  if (!existsSync(path.join(root, relativePath))) {
    errors.push(`Missing required agent document: ${relativePath}`);
  }
}

for (const item of requiredMentions) {
  const filePath = path.join(root, item.file);
  if (!existsSync(filePath)) {
    continue;
  }
  const text = readFileSync(filePath, "utf8");
  if (!text.includes(item.text)) {
    errors.push(`${item.file} must mention ${item.text}`);
  }
}

if (errors.length > 0) {
  console.error("Agent document check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Agent document check passed.");
