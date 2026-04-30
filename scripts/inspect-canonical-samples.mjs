import fs from 'node:fs';
import path from 'node:path';
import { normalizeKoreanInput } from '../src/normalizeKoreanInput.js';

const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const { parallelIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const pickByChar = (char) => parallelIndex.find((item) => item.text.includes(char));
const samples = [
  pickByChar('?'),
  pickByChar('.'),
  pickByChar(','),
  pickByChar('('),
  pickByChar('%'),
].filter(Boolean);

const report = samples.map((item) => ({
  sourceText: item.text,
  canonicalText: item.canonicalText,
  searchKeys: item.searchKeys,
  folderId: item.folderId,
  dataset: item.dataset,
  path: item.primaryVideoKey,
  normalizedInputPreview: normalizeKoreanInput(item.text),
}));

console.log(JSON.stringify(report, null, 2));
