const fs = require('fs');
let appJs = fs.readFileSync('js/app.js', 'utf8');
appJs = appJs.replace('async async function renderExamples', 'async function renderExamples');
fs.writeFileSync('js/app.js', appJs, 'utf8');
