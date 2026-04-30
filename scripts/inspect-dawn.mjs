import { parallelIndex } from '../src/generated/corpusIndex.generated.js';
const hits = parallelIndex.filter((x) => x.text.includes('새벽') || x.text.includes('밤') || x.text.includes('아침') || x.text.includes('오전') || x.text.includes('1시') || x.text.includes('한 시'));
console.log(hits.slice(0, 60).map((x) => `${x.text}|${x.folderId}`).join('\n'));
console.log(`count=${hits.length}`);
