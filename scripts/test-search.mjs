import fs from 'node:fs';
import path from 'node:path';
import { searchCorpusByInputCore } from '../src/searchCore.js';

const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const { parallelIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const queries = ['안녕하세요', '감사합니다', '사과는 맛있나요', '학교에 갔어요', '오늘 날씨 어때요'];
for (const query of queries) {
  const result = searchCorpusByInputCore({ input: query, parallelIndex });
  console.log(`\n=== ${query} ===`);
  console.log('selectedTop:', result.matches[0] ? `${result.matches[0].resultType}|${result.matches[0].score}+${result.matches[0].selectionBoost || 0}|${result.matches[0].text}|${result.matches[0].folderId}` : 'none');
  console.log('parallelTop:', result.parallelMatches[0] ? `${result.parallelMatches[0].score}|${result.parallelMatches[0].text}|${result.parallelMatches[0].folderId}` : 'none');
}
