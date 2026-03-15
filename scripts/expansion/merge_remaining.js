const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const mainDoc = path.join(projectRoot, 'COMPREHENSIVE-PHASE-PLAN.doc');
const expansionDir = __dirname;

const file = 'EXPANSION-REMAINING.doc';
const filePath = path.join(expansionDir, file);

if (!fs.existsSync(filePath)) {
  console.error('ERROR: EXPANSION-REMAINING.doc not found.');
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const linesBefore = fs.readFileSync(mainDoc, 'utf-8').split('\n').length;

// Append with a separator header
const separator = `

================================================================================
  FINAL ADDENDUM: REMAINING 13 v1+v2 SCREEN SPECIFICATIONS
================================================================================

  Completes full coverage of all screens. Previous addendum covered 34 screens.
  This final section covers: A1, B1, D1, D3, E2, F3, J1, J2, J3, J4, K1, K2, K3.

  With this addition, every screen in the app-structure/README.md has a full
  detailed specification including Frontend, Backend, Data Flow, Animations,
  Accessibility, and Test targets.

================================================================================

`;

fs.appendFileSync(mainDoc, separator + content + '\n', 'utf-8');

const linesAfter = fs.readFileSync(mainDoc, 'utf-8').split('\n').length;
console.log(`  [OK] ${file} (${content.split('\n').length} lines)`);
console.log(`  Lines before: ${linesBefore}`);
console.log(`  Lines after:  ${linesAfter}`);
console.log(`  Lines added:  ${linesAfter - linesBefore}`);
