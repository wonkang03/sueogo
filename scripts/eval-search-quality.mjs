import fs from 'node:fs';
import path from 'node:path';
import { searchCorpusByInputCore } from '../src/searchCore.js';

const fixturePath = path.resolve('scripts/search-quality-fixtures.json');
const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const fixtures = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const { parallelIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

let passed = 0;
const results = [];

for (const fixture of fixtures) {
  const result = searchCorpusByInputCore({ input: fixture.query, parallelIndex });
  const top = result.matches[0] || null;
  const text = top?.text || '';
  const expectNone = fixture.expectedType === 'none';
  const typeOk = expectNone ? !top : (!fixture.expectedType || top?.resultType === fixture.expectedType);
  const textOk = expectNone ? true : (!fixture.mustIncludeAny?.length || fixture.mustIncludeAny.some((needle) => text.includes(needle)));
  const ok = expectNone ? !top : (Boolean(top) && typeOk && textOk);
  if (ok) passed += 1;
  results.push({ query: fixture.query, ok, selectedType: top?.resultType || 'none', selectedText: text, score: top ? `${top.score}+${top.selectionBoost || 0}` : 'none' });
}

console.log(`passed=${passed}/${fixtures.length}`);
for (const row of results) {
  console.log(`${row.ok ? 'OK' : 'FAIL'} | ${row.query} | ${row.selectedType} | ${row.score} | ${row.selectedText}`);
}
