const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:\\Users\\NB\\.gemini\\antigravity\\brain\\9cc16c7e-002f-4b6b-9f74-5d9c2b4a1708\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let found = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
      for (const t of obj.tool_calls) {
         if (t.name === 'write_to_file' || t.name === 'default_api:write_to_file') {
             if (t.args.TargetFile && t.args.TargetFile.includes('app.js')) {
                 found = t.args.CodeContent;
             }
         }
      }
    }
  }
  
  if (found) {
    fs.writeFileSync('js/app.js.orig', found, 'utf8');
    console.log("Restored app.js.orig! Length:", found.length);
  } else {
    console.log("Not found.");
  }
}
extract();
