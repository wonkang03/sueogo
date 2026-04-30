import fs from 'node:fs';
import path from 'node:path';
import { createGlossIndexEntry } from '../src/glossSearch.js';
import { buildKoreanTextSearchKeys, expandMeaningTokens, normalizeKoreanInput } from '../src/normalizeKoreanInput.js';

const projectRoot = path.resolve('G:\\sueogo');
const srcRoot = path.join(projectRoot, 'src');
const assetsRoot = path.join(srcRoot, 'assets');
const outputDir = path.join(srcRoot, 'generated');
const outputFile = path.join(outputDir, 'corpusIndex.generated.json');

const KOREAN_PARTICLES = [
  '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '께', '한테', '와', '과', '랑', '으로', '로', '도', '만', '이나', '나', '처럼', '보다', '부터', '까지', '밖에', '마저', '조차', '인데', '이다', '입니다', '예요', '이에요', '하고',
];
const KOREAN_ENDINGS = ['요', '죠', '네요', '군요', '습니다', '습니까', '어요', '아요', '여요', '했다', '한다', '해요', '했어요'];

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/["'“”‘’.,!?()[\]{}<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripKoreanSuffix(token = '') {
  let result = token;
  for (const ending of KOREAN_ENDINGS) {
    if (result.length > ending.length + 1 && result.endsWith(ending)) {
      result = result.slice(0, -ending.length);
      break;
    }
  }
  for (const particle of [...KOREAN_PARTICLES].sort((a, b) => b.length - a.length)) {
    if (result.length > particle.length + 1 && result.endsWith(particle)) {
      result = result.slice(0, -particle.length);
      break;
    }
  }
  return result;
}

function tokenizeKoreanText(value = '') {
  const normalized = normalizeText(value);
  const baseTokens = normalized.split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 2);
  const expanded = [];
  for (const token of baseTokens) {
    expanded.push(token);
    const stripped = stripKoreanSuffix(token);
    if (stripped && stripped.length >= 2 && stripped !== token) expanded.push(stripped);
  }
  expanded.push(...expandMeaningTokens(normalized));
  return Array.from(new Set(expanded.filter(Boolean)));
}

function toAssetKey(absPath) {
  const rel = path.relative(srcRoot, absPath).split(path.sep).join('/');
  return `./${rel}`;
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'));
}

function getDirectories(absPath) {
  return fs.readdirSync(absPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function buildParallelIndexes() {
  const datasets = [
    { key: 'parallel_ko_2022', label: '한국어-수어 병렬 말뭉치 2022', year: 2022 },
    { key: 'parallel_ko_2023', label: '한국어-수어 병렬 말뭉치 2023', year: 2023 },
    { key: 'parallel_ko_2024', label: '한국어-수어 병렬 말뭉치 2024', year: 2024 },
  ];

  const parallelIndex = [];
  const glossIndex = [];

  for (const dataset of datasets) {
    const datasetRoot = path.join(assetsRoot, dataset.key);
    if (!fs.existsSync(datasetRoot)) continue;

    for (const folderId of getDirectories(datasetRoot)) {
      const folderRoot = path.join(datasetRoot, folderId);
      const jsonPath = path.join(folderRoot, `${folderId}.json`);
      if (!fs.existsSync(jsonPath)) continue;

      const doc = readJson(jsonPath);
      const text = doc?.krlgg_sntenc?.koreanText || '';
      if (!text) continue;

      const allFiles = fs.readdirSync(folderRoot);
      const mp4Files = allFiles.filter((name) => name.toLowerCase().endsWith('.mp4')).sort();
      const primaryVideo = mp4Files.find((name) => name === `${folderId}.mp4`)
        || mp4Files.find((name) => name === `${folderId}L.mp4`)
        || mp4Files.find((name) => name === `${folderId}R.mp4`)
        || mp4Files[0]
        || null;
      const primaryVideoKey = primaryVideo ? toAssetKey(path.join(folderRoot, primaryVideo)) : '';

      const sentenceLoc = Array.isArray(doc?.sign_script?.sentence_loc) ? doc.sign_script.sentence_loc : [];
      const strongGestures = Array.isArray(doc?.sign_script?.sign_gestures_strong) ? doc.sign_script.sign_gestures_strong : [];
      const timingPool = sentenceLoc.length ? sentenceLoc : strongGestures;
      const starts = timingPool.map((item) => Number(item?.start)).filter((value) => Number.isFinite(value));
      const ends = timingPool.map((item) => Number(item?.end)).filter((value) => Number.isFinite(value));
      const startMs = starts.length ? Math.round(Math.min(...starts) * 1000) : 0;
      const endMs = ends.length ? Math.round(Math.max(...ends) * 1000) : 0;

      const koreanTextNormalized = normalizeKoreanInput(text);

      const searchText = koreanTextNormalized.canonical || koreanTextNormalized.normalized || text;

      parallelIndex.push({
        corpus: 'parallel',
        dataset: dataset.key,
        source: dataset.label,
        folderId,
        text,
        normalizedText: normalizeText(searchText),
        canonicalText: searchText,
        searchNormalizedText: searchText,
        searchKeys: buildKoreanTextSearchKeys(text),
        tokens: tokenizeKoreanText(searchText),
        primaryVideoKey,
        videoKeys: mp4Files.map((name) => toAssetKey(path.join(folderRoot, name))),
        start: startMs,
        end: endMs,
        signSentence: doc?.sign_lang_sntenc || '',
      });

      for (const gesture of strongGestures) {
        const start = Number(gesture?.start);
        const end = Number(gesture?.end);
        if (!Number.isFinite(start) || !Number.isFinite(end) || !gesture?.gloss_id || !primaryVideoKey) continue;
        glossIndex.push(createGlossIndexEntry({
          dataset: dataset.key,
          source: dataset.label,
          folderId,
          videoKey: primaryVideoKey,
          sourceText: text,
          gloss: gesture.gloss_id,
          start: Math.round(start * 1000),
          end: Math.round(end * 1000),
          year: dataset.year,
        }));
      }
    }
  }

  return { parallelIndex, glossIndex };
}

const { parallelIndex, glossIndex } = buildParallelIndexes();
const output = {
  parallelIndex,
  glossIndex,
  annotateIndex: [],
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(output), 'utf8');

console.log(`parallelIndex=${output.parallelIndex.length}`);
console.log(`glossIndex=${output.glossIndex.length}`);
console.log(`annotateIndex=${output.annotateIndex.length}`);
console.log(`output=${outputFile}`);
