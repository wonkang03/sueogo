import fs from 'node:fs';
import path from 'node:path';
import { searchCorpusByInputCore } from '../src/searchCore.js';

const indexPath = path.resolve('src/generated/corpusIndex.generated.json');
const { parallelIndex = [] } = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const query = process.argv.slice(2).join(' ') || '지금 몇 시';
const result = searchCorpusByInputCore({ input: query, parallelIndex });
console.log(JSON.stringify(result.matches.slice(0, 10), null, 2));
