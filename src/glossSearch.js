import { expandMeaningTokens, normalizeKoreanInput } from './normalizeKoreanInput.js';

const KOREAN_PARTICLES = [
  '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '께', '한테', '와', '과', '랑', '으로', '로', '도', '만', '이나', '나', '처럼', '보다', '부터', '까지', '밖에', '마저', '조차', '인데', '이다', '입니다', '예요', '이에요', '하고',
];

const KOREAN_ENDINGS = ['요', '죠', '네요', '군요', '습니다', '습니까', '어요', '아요', '여요', '했다', '한다', '해요', '했어요', '있어', '있어요'];
const KOREAN_VERB_ENDING_RULES = [
  { pattern: /(었어요|았어요|였어요)$/u, replace: '다' },
  { pattern: /(었어|았어|였어)$/u, replace: '다' },
  { pattern: /(어요|아요|여요)$/u, replace: '다' },
  { pattern: /(어|아|여)$/u, replace: '다' },
  { pattern: /(고있어요)$/u, replace: '고 있다' },
  { pattern: /(고있어)$/u, replace: '고 있다' },
];
const SAME_FOLDER_COVERAGE_THRESHOLD = 0.6;

function normalizeText(value = '') {
  const normalized = normalizeKoreanInput(value);
  return String(normalized.canonical || normalized.normalized || value)
    .toLowerCase()
    .replace(/["'“”‘’.,!?()[\]{}<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSuffix(token = '') {
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

function applyVerbEndingRules(token = '') {
  const results = new Set();
  const normalized = normalizeText(token);
  if (!normalized) return [];

  for (const { pattern, replace } of KOREAN_VERB_ENDING_RULES) {
    if (!pattern.test(normalized)) continue;
    const replaced = normalized.replace(pattern, replace).trim();
    if (!replaced) continue;
    results.add(replaced);
    if (replaced.includes(' ')) {
      replaced.split(/\s+/).filter(Boolean).forEach((part) => results.add(part));
    }
  }

  if (
    normalized.endsWith('먹었어')
    || normalized.endsWith('먹었어요')
    || normalized.endsWith('먹어')
    || normalized.endsWith('먹어요')
    || normalized.endsWith('먹을게요')
    || normalized.endsWith('먹을께요')
    || normalized.endsWith('먹을거에요')
    || normalized.endsWith('먹을거예요')
    || normalized.endsWith('먹을꺼에요')
    || normalized.endsWith('먹을꺼예요')
    || normalized.endsWith('먹을래요')
    || normalized.endsWith('먹을래')
    || normalized.endsWith('먹을까요')
    || normalized.endsWith('먹을까')
  ) {
    results.add('먹다');
    results.add('먹');
  }

  return [...results].filter(Boolean);
}

function expandToken(token = '') {
  const values = new Set();
  const normalized = normalizeText(token);
  if (!normalized) return [];
  values.add(normalized);
  const stripped = stripSuffix(normalized);
  if (stripped && stripped.length >= 1) values.add(stripped);
  for (const variant of applyVerbEndingRules(normalized)) values.add(variant);
  for (const variant of expandMeaningTokens(normalized)) values.add(variant);
  if (normalized.endsWith('해') || normalized.endsWith('해요')) values.add('하다');
  if (normalized.endsWith('있어') || normalized.endsWith('있어요')) values.add('있다');
  if (normalized.endsWith('했어') || normalized.endsWith('했어요')) values.add('하다');
  return [...values].filter(Boolean);
}

function buildGlossVocabulary(glossIndex = []) {
  const vocab = new Set();
  for (const entry of glossIndex) {
    if (entry?.glossNormalized) vocab.add(entry.glossNormalized);
    for (const variant of entry?.glossVariants || []) {
      if (variant) vocab.add(variant);
    }
  }
  return vocab;
}

function splitCompoundToken(token = '', glossVocabulary = new Set()) {
  const normalized = normalizeText(token);
  if (!normalized || normalized.includes(' ')) return [];

  const pieces = [];
  for (let i = 1; i < normalized.length; i += 1) {
    const leftRaw = normalized.slice(0, i);
    const rightRaw = normalized.slice(i);
    if (leftRaw.length < 2 || rightRaw.length < 2) continue;
    const leftCandidates = expandToken(leftRaw).filter((candidate) => candidate.length >= 2);
    const rightCandidates = expandToken(rightRaw).filter((candidate) => candidate.length >= 2);
    const left = leftCandidates.find((candidate) => glossVocabulary.has(candidate));
    const right = rightCandidates.find((candidate) => glossVocabulary.has(candidate));
    if (!left || !right) continue;
    pieces.push([left, right]);
  }

  if (!pieces.length) return [];
  pieces.sort((a, b) => ((b[0].length + b[1].length) - (a[0].length + a[1].length)) || (b[0].length - a[0].length));
  return pieces[0];
}

function tokenizeInput(input = '', glossIndex = []) {
  const normalized = normalizeText(input);
  const baseTokens = normalized.split(/\s+/).map((token) => token.trim()).filter(Boolean);
  const glossVocabulary = buildGlossVocabulary(glossIndex);
  const expanded = [];
  for (const token of baseTokens) {
    const direct = expandToken(token);
    const directGlossMatches = direct.filter((candidate) => glossVocabulary.has(candidate));
    const split = !token.includes(' ') ? splitCompoundToken(token, glossVocabulary) : [];

    if (split.length) {
      split.forEach((part) => {
        expandToken(part)
          .filter((candidate) => glossVocabulary.has(candidate))
          .forEach((candidate) => expanded.push(candidate));
      });
      continue;
    }

    if (directGlossMatches.length) {
      expanded.push(...directGlossMatches);
      continue;
    }

    expanded.push(...direct);
  }
  return [...new Set(expanded)].filter((token) => token.length >= 1);
}

function normalizeGloss(gloss = '') {
  return String(gloss)
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/[0-9]+[A-Z#]?$/g, '')
    .replace(/[^가-힣a-zA-Z\s]/g, ' ')
    .replace(/[/.·,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreEntry(token, entry) {
  if (!entry || !entry.glossNormalized) return -1;
  if (entry.glossVariants?.includes(token)) return 120;
  if (entry.glossNormalized === token) return 110;
  if (entry.glossNormalized?.includes(token)) return 70;
  if (entry.glossNormalized.length >= 2 && token.includes(entry.glossNormalized)) return 60;
  return -1;
}

function buildTokenMatches(glossIndex, tokens) {
  return tokens.map((token) => {
    const matches = glossIndex
      .map((entry) => ({ entry, score: scoreEntry(token, entry) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.start - b.entry.start)
      .slice(0, 20);
    return { token, matches };
  }).filter((item) => item.matches.length);
}

function chooseBestSequence(tokenMatches) {
  const folderScores = new Map();
  for (const tokenMatch of tokenMatches) {
    const seen = new Set();
    for (const { entry, score } of tokenMatch.matches) {
      if (seen.has(entry.folderId)) continue;
      seen.add(entry.folderId);
      const current = folderScores.get(entry.folderId) || { score: 0, hits: 0, ranges: [] };
      current.score += score;
      current.hits += 1;
      current.ranges.push([entry.start || 0, entry.end || 0]);
      folderScores.set(entry.folderId, current);
    }
  }

  let bestFolderId = null;
  let bestMeta = { score: -1, hits: -1, compactness: Number.POSITIVE_INFINITY };
  for (const [folderId, meta] of folderScores.entries()) {
    const starts = meta.ranges.map(([start]) => start);
    const ends = meta.ranges.map(([, end]) => end);
    const compactness = starts.length ? (Math.max(...ends) - Math.min(...starts)) : Number.POSITIVE_INFINITY;
    if (
      meta.hits > bestMeta.hits
      || (meta.hits === bestMeta.hits && meta.score > bestMeta.score)
      || (meta.hits === bestMeta.hits && meta.score === bestMeta.score && compactness < bestMeta.compactness)
    ) {
      bestFolderId = folderId;
      bestMeta = { ...meta, compactness };
    }
  }

  const bestFolderCoverage = tokenMatches.length ? (bestMeta.hits / tokenMatches.length) : 0;
  const preferSingleFolder = bestFolderCoverage >= SAME_FOLDER_COVERAGE_THRESHOLD;

  const segments = [];
  for (const tokenMatch of tokenMatches) {
    const sameFolderMatch = tokenMatch.matches.find((item) => item.entry.folderId === bestFolderId);
    const bestGlobalMatch = tokenMatch.matches[0];

    let preferred = null;
    if (preferSingleFolder) {
      preferred = sameFolderMatch || bestGlobalMatch;
    } else {
      preferred = sameFolderMatch || bestGlobalMatch;
    }

    if (!preferred) continue;
    segments.push({
      token: tokenMatch.token,
      ...preferred.entry,
      tokenScore: preferred.score,
      selectionSource: sameFolderMatch && preferred.entry.folderId === bestFolderId ? 'same-folder' : 'fallback-folder',
    });
  }

  return segments;
}

function mergeAdjacentSegments(segments = []) {
  if (!segments.length) return [];
  const merged = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (
      last
      && last.videoKey === segment.videoKey
      && segment.start <= last.end + 120
      && segment.start >= last.start
    ) {
      last.end = Math.max(last.end, segment.end);
      last.tokens = [...new Set([...last.tokens, segment.token])];
      last.glosses = [...new Set([...last.glosses, segment.gloss])];
      continue;
    }
    merged.push({
      videoKey: segment.videoKey,
      folderId: segment.folderId,
      year: segment.year,
      dataset: segment.dataset,
      start: segment.start,
      end: segment.end,
      tokens: [segment.token],
      glosses: [segment.gloss],
      sourceText: segment.sourceText,
      source: segment.source,
    });
  }
  return merged;
}

export function searchByGlossIndex({ input = '', glossIndex = [] }) {
  const query = normalizeText(input);
  const tokens = tokenizeInput(input, glossIndex);
  if (!query || !tokens.length) {
    return { query: input, normalizedQuery: query, queryTokens: tokens, matches: [], suggestions: [] };
  }

  const tokenMatches = buildTokenMatches(glossIndex, tokens);
  if (!tokenMatches.length) {
    return { query: input, normalizedQuery: query, queryTokens: tokens, matches: [], suggestions: [] };
  }

  const selectedSegments = chooseBestSequence(tokenMatches);
  const playbackSegments = mergeAdjacentSegments(selectedSegments);
  const matchedTokens = [...new Set(selectedSegments.map((segment) => segment.token))];
  const missingTokens = tokens.filter((token) => !matchedTokens.includes(token));

  const primary = playbackSegments[0];
  const result = primary ? {
    corpus: 'parallelGloss',
    resultType: 'gloss-sequence',
    source: 'parallel-gloss',
    text: input,
    normalizedQuery: query,
    folderId: primary.folderId,
    dataset: primary.dataset,
    year: primary.year,
    videoKey: primary.videoKey,
    start: primary.start,
    end: primary.end,
    matchedTokens,
    missingTokens,
    segments: playbackSegments,
    tokenMatches: selectedSegments.map(({ token, gloss, start, end, folderId, videoKey, year, dataset }) => ({ token, gloss, start, end, folderId, videoKey, year, dataset })),
    summary: `${matchedTokens.join(' → ')}${missingTokens.length ? ` (누락: ${missingTokens.join(', ')})` : ''}`,
  } : null;

  return {
    query: input,
    normalizedQuery: query,
    queryTokens: tokens,
    matches: result ? [result] : [],
    suggestions: tokenMatches.slice(0, 5).map((item) => item.matches[0]?.entry?.glossNormalized).filter(Boolean),
  };
}

export function createGlossIndexEntry({ dataset, source, folderId, videoKey, sourceText, gloss, start, end, year }) {
  const glossNormalized = normalizeGloss(gloss);
  const glossVariants = [...new Set(glossNormalized.split(/\s+/).flatMap((token) => expandToken(token)))].filter(Boolean);
  return {
    corpus: 'parallelGloss',
    dataset,
    source,
    folderId,
    videoKey,
    sourceText,
    gloss,
    glossNormalized,
    glossVariants,
    start,
    end,
    year,
  };
}
