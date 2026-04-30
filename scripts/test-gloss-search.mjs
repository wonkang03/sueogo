import fs from 'node:fs';
import path from 'node:path';
import { searchByGlossIndex } from '../src/glossSearch.js';

const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const { glossIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const queries = ['지금 밖에 있어', '안녕', '고마워', '학교 가다'];

for (const query of queries) {
  const result = searchByGlossIndex({ input: query, glossIndex });
  const top = result.matches[0];
  console.log(`\n=== ${query} ===`);
  if (!top) {
    console.log('NO_MATCH');
    continue;
  }
  console.log('matchedTokens:', top.matchedTokens);
  console.log('missingTokens:', top.missingTokens);
  console.log('segments:', top.segments.map((segment) => ({ folderId: segment.folderId, start: segment.start, end: segment.end, glosses: segment.glosses, tokens: segment.tokens })));
}
