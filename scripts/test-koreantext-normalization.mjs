import fs from 'node:fs';
import path from 'node:path';
import { normalizeKoreanInput } from '../src/normalizeKoreanInput.js';

const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const { parallelIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const knownSentence = parallelIndex[0]?.text || '';
const typoSentence = knownSentence.replace(/있어/g, '잇어').replace(/  +/g, ' ');
const queries = ['안녕', '안뇽', '지금 밖에 있어', '지금  밖에\n있어', '잇어', knownSentence, `${knownSentence}\n`, typoSentence];

for (const query of queries) {
  const normalized = normalizeKoreanInput(query);
  const hit = parallelIndex.find((item) => {
    const keys = item.searchKeys || [item.searchNormalizedText || item.normalizedText].filter(Boolean);
    return normalized.variants.some((variant) => keys.includes(variant));
  });
  console.log(`\n=== ${query} ===`);
  console.log('normalized:', normalized);
  console.log('hit:', hit ? { text: hit.text, folderId: hit.folderId, dataset: hit.dataset } : null);
}
