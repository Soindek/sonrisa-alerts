// Appends every prompt sent to Claude Code to prompts/raw.md, verbatim.
// Runs as a UserPromptSubmit hook; Claude Code passes a JSON payload on stdin.
// Deliberately defensive about the payload shape: if the expected field is
// missing, the whole payload is logged so nothing is lost.
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let prompt;
  try {
    const payload = JSON.parse(input);
    prompt = payload.prompt ?? payload.user_prompt ?? JSON.stringify(payload);
  } catch {
    prompt = input;
  }

  const file = path.join(process.cwd(), 'prompts', 'raw.md');
  const entry = `\n## ${new Date().toISOString()}\n\n${prompt.trim()}\n`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, entry, 'utf8');
  process.exit(0);
});
