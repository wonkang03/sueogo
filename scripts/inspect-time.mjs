import { parallelIndex } from '../src/generated/corpusIndex.generated.js';
const hits = parallelIndex.filter((x) => x.text.includes('새벽') || x.text.includes('밤') || x.text.includes('시간') || x.text.includes('지금') || x.text.includes('1시'));
console.log(hits.slice(0, 40).map((x) => `${x.text}|${x.folderId}`).join('\n'));
console.log(`count=${hits.length}`);
