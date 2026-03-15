const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const mainDoc = path.join(projectRoot, 'COMPREHENSIVE-PHASE-PLAN.doc');
const expansionDir = __dirname;

// Files to merge in order
const expansionFiles = [
  'EXPANSION-P2-ALL.doc',   // Phase 2: B2-B4, D2, D4-D6, E1, E3-E4, F1-F2, G1, H1-H4, I1 + NLP, Content Strategy, Design System
  'EXPANSION-P34-ALL.doc',  // Phase 3+4: J5-J6, I2-I4, L1-L2, M1-M2, N1-N5, P1-P2 + Game Mode, Accessibility, Widgets, Watch, Import, Empty States, Easter Eggs
];

// Header for the addendum
const header = `

================================================================================
  ADDENDUM: DETAILED SCREEN SPECIFICATIONS & MISSING SYSTEMS
================================================================================

  This addendum covers all 28 previously missing v1 screens with detailed
  Frontend (Flutter) and Backend (Hono/TypeScript) specifications, plus
  8 missing systems (NLP Parser, Task Import, Widgets, Watch App, Game Mode,
  Design System, Accessibility, Content Strategy, Empty States, Easter Eggs,
  Seasonal UI, Upgrade Prompts).

  Each screen spec includes:
    - Flutter package, route, widgets, Riverpod state, Drift tables
    - Backend API endpoints with request/response shapes
    - Data flow (user action to backend and back)
    - Interactions & animations
    - DSA/algorithms used
    - Test targets

  Clarification: "Smart Suggest" / "AI Insight" in C1 Home Screen uses
  RULE-BASED logic in v1 (defer count, completion patterns, simple heuristics).
  Full AI (Claude API) is deferred to v2 Phase 1.

================================================================================

`;

let mergedContent = header;
let filesFound = 0;
let filesMissing = [];

for (const file of expansionFiles) {
  const filePath = path.join(expansionDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    mergedContent += content + '\n\n';
    filesFound++;
    console.log(`  [OK] ${file} (${content.split('\n').length} lines)`);
  } else {
    filesMissing.push(file);
    console.log(`  [MISSING] ${file}`);
  }
}

if (filesFound === 0) {
  console.error('\nERROR: No expansion files found. Agents may still be running.');
  process.exit(1);
}

// Append to main doc
fs.appendFileSync(mainDoc, mergedContent, 'utf-8');

const totalLines = fs.readFileSync(mainDoc, 'utf-8').split('\n').length;
console.log(`\nMerged ${filesFound}/${expansionFiles.length} files into COMPREHENSIVE-PHASE-PLAN.doc`);
console.log(`Total lines in main doc: ${totalLines}`);

if (filesMissing.length > 0) {
  console.log(`\nWARNING: Missing files: ${filesMissing.join(', ')}`);
  console.log('Run this script again after all agents complete.');
}
