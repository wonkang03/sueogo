import { parallelIndex } from '../src/generated/corpusIndex.generated.js';
import { searchCorpusByInputCore } from '../src/searchCore.js';

const query = process.argv.slice(2).join(' ') || '안녕';
const result = searchCorpusByInputCore({ input: query, parallelIndex });
console.log(JSON.stringify(result, null, 2));
