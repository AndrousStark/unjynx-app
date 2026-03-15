const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const mainDoc = path.join(projectRoot, 'COMPREHENSIVE-PHASE-PLAN.doc');
const expansionDir = __dirname;

const files = [
  'EXPANSION-SYSTEMS.doc',    // Part IV: Offline Sync, Admin, Analytics, Notification SLA, Content Mgmt
  'EXPANSION-REFS-P1.doc',    // Part V-A: API endpoints, DB schema, ML algorithms
  'EXPANSION-REFS-P2.doc',    // Part V-B: Flutter patterns, Pricing, Design System, Terminology
];

const linesBefore = fs.readFileSync(mainDoc, 'utf-8').split('\n').length;
let totalAdded = 0;

for (const file of files) {
  const filePath = path.join(expansionDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    fs.appendFileSync(mainDoc, '\n' + content, 'utf-8');
    const lines = content.split('\n').length;
    totalAdded += lines;
    console.log(`  [OK] ${file} (${lines} lines)`);
  } else {
    console.log(`  [MISSING] ${file}`);
  }
}

const linesAfter = fs.readFileSync(mainDoc, 'utf-8').split('\n').length;
console.log(`\nMerge complete.`);
console.log(`  Before: ${linesBefore} lines`);
console.log(`  After:  ${linesAfter} lines`);
console.log(`  Added:  ${linesAfter - linesBefore} lines`);
