#!/usr/bin/env node

const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');

const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

let payload = {};
try {
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  payload = raw ? JSON.parse(raw) : {};
} catch {
  payload = {};
}

const eventName = payload.hook_event_name ?? "SessionStart";
const repoPath = payload.cwd ?? process.cwd();
const latestHandoffPrompt = readLatestHandoffPrompt(repoPath);
const additionalContext = [
  'Devflow Native harness context:',
  '- Run devflow harness inspect before changing harness files.',
  '- Run devflow status before command-heavy work.',
  '- Finish with review, gate evidence, risks, and a next-session prompt.',
  '- If review is required, run devflow review request --work <id>, then devflow review record --work <id> before devflow finish.',
  '- If finish returns review.nextAction.command or review.nextAction.recordCommand, follow both before claiming completion.',
  ...(latestHandoffPrompt ? ['', 'Latest handoff prompt:', latestHandoffPrompt] : []),
].join('\n');

process.stdout.write(`${JSON.stringify({
  hookSpecificOutput: {
    hookEventName: eventName,
    additionalContext,
  },
})}\n`);

function readLatestHandoffPrompt(repoPath) {
  try {
    const prompt = readFileSync(join(repoPath, '.devflow', 'next-prompt.md'), 'utf8').trim();
    return prompt.length > 2200 ? `${prompt.slice(0, 2200)}\n...truncated...` : prompt;
  } catch {
    return '';
  }
}