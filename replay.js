const fs = require('fs');
const readline = require('readline');

async function replay() {
  let content = fs.readFileSync('js/app.js.orig', 'utf8');
  
  const fileStream = fs.createReadStream('C:\\Users\\NB\\.gemini\\antigravity\\brain\\9cc16c7e-002f-4b6b-9f74-5d9c2b4a1708\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    
    // We only want to replay up to step 1360 (before the corruption at 1370)
    if (obj.step_index >= 1370) break;

    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
      for (const t of obj.tool_calls) {
         if ((t.name === 'replace_file_content' || t.name === 'default_api:replace_file_content') && t.args.TargetFile && t.args.TargetFile.includes('app.js')) {
             const target = t.args.TargetContent;
             const repl = t.args.ReplacementContent;
             if (content.includes(target)) {
                 content = content.replace(target, repl);
                 console.log(`Step ${obj.step_index}: Applied replace_file_content`);
             } else {
                 console.log(`Step ${obj.step_index}: Failed to find TargetContent!`);
             }
         }
         else if ((t.name === 'multi_replace_file_content' || t.name === 'default_api:multi_replace_file_content') && t.args.TargetFile && t.args.TargetFile.includes('app.js')) {
             let success = true;
             let newContent = content;
             for (const chunk of t.args.ReplacementChunks) {
                 const target = chunk.TargetContent;
                 const repl = chunk.ReplacementContent;
                 if (newContent.includes(target)) {
                     newContent = newContent.replace(target, repl);
                 } else {
                     success = false;
                     console.log(`Step ${obj.step_index}: Failed chunk find! Target: ${target.substring(0, 50)}`);
                 }
             }
             if (success) {
                 content = newContent;
                 console.log(`Step ${obj.step_index}: Applied multi_replace_file_content`);
             } else {
                 // Force apply the ones that did match
                 content = newContent; 
                 console.log(`Step ${obj.step_index}: Partially applied multi_replace_file_content`);
             }
         }
         // Handle run_command sed or PowerShell replacements?
         else if ((t.name === 'run_command' || t.name === 'default_api:run_command') && t.args.CommandLine) {
             const cmd = t.args.CommandLine;
             if (cmd.includes('Set-Content') && cmd.includes('js/app.js')) {
                 console.log(`Step ${obj.step_index}: CAUTION! PowerShell Set-Content used on app.js!`);
             }
         }
      }
    }
  }
  
  fs.writeFileSync('js/app.js.recovered', content, 'utf8');
  console.log('Saved app.js.recovered');
}
replay();
