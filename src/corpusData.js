import { searchCorpusByInputCore } from './searchCore.js';
import { searchByGlossIndex } from './glossSearch.js';
import { INPUT_NORMALIZATION_RULES, normalizeKoreanInput } from './normalizeKoreanInput.js';

const INDEX_URL = '/api/sign-video/index';
const ASSET_URL = '/api/sign-video/asset';

let indexPromise = null;

async function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(INDEX_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`인덱스 로드 실패 (${response.status})`);
        }
        return response.json();
      });
  }

  return indexPromise;
}

function buildAssetUrl(videoKey = '') {
  if (!videoKey) return '';
  return `${ASSET_URL}?path=${encodeURIComponent(videoKey)}`;
}

export const corpusSearchIndex = {
  parallelCount: 0,
  glossCount: 0,
  annotateCount: 0,
  normalizationRules: INPUT_NORMALIZATION_RULES,
};

export async function resolveSearchResultVideo(result) {
  if (!result) return result;
  const segments = Array.isArray(result.segments) ? result.segments : [];
  const resolvedSegments = segments.map((segment) => ({
    ...segment,
    videoUrl: buildAssetUrl(segment.videoKey || ''),
  }));
  const primaryVideoKey = result.videoKey || resolvedSegments[0]?.videoKey || '';
  return {
    ...result,
    videoUrl: buildAssetUrl(primaryVideoKey),
    segments: resolvedSegments,
  };
}

function toResolvedMatch(item, extras = {}) {
  return {
    ...item,
    ...extras,
    videoKey: item.videoKey || item.primaryVideoKey || item.videoKeys?.[0] || '',
  };
}

function findExactKoreanTextMatch(parallelIndex = [], input = '') {
  const normalized = normalizeKoreanInput(input);
  if (!normalized.canonical && !normalized.normalized) return null;

  const variants = normalized.variants || [];
  const exactMatches = parallelIndex.filter((item) => {
    const itemKeys = Array.isArray(item.searchKeys) && item.searchKeys.length
      ? item.searchKeys
      : [item.searchNormalizedText || item.normalizedText || ''].filter(Boolean);
    return variants.some((variant) => itemKeys.includes(variant));
  });

  if (!exactMatches.length) return null;

  const selected = exactMatches
    .sort((a, b) => (
      a.text.length - b.text.length
      || (a.dataset > b.dataset ? -1 : 1)
      || a.start - b.start
    ))[0];

  return {
    query: input,
    normalizedQuery: normalized.canonical || normalized.normalized,
    queryTokens: variants,
    matchType: 'koreanText-exact',
    normalization: normalized,
    matches: [toResolvedMatch(selected, {
      resultType: 'parallel_koreanText_exact',
      playbackMode: 'parallel',
      summary: 'koreanText exact match',
    })].filter((item) => item.videoKey),
    suggestions: [],
  };
}

export async function searchCorpusByInput(input = '') {
  const { parallelIndex = [], glossIndex = [], annotateIndex = [] } = await loadIndex();
  corpusSearchIndex.parallelCount = parallelIndex.length;
  corpusSearchIndex.glossCount = glossIndex.length;
  corpusSearchIndex.annotateCount = annotateIndex.length;

  const normalizedInput = normalizeKoreanInput(input);
  const exactResult = findExactKoreanTextMatch(parallelIndex, input);
  if (exactResult?.matches?.length) {
    return {
      ...exactResult,
      annotateMatches: [],
      parallelMatches: exactResult.matches,
      fallbackMatches: [],
    };
  }

  const glossResult = searchByGlossIndex({ input, glossIndex });
  const suggestionResult = searchCorpusByInputCore({ input, parallelIndex });
  const glossMatches = (glossResult.matches || []).map((item) => toResolvedMatch(item)).filter((item) => item.videoKey);

  if (glossMatches.length) {
    return {
      ...glossResult,
      matchType: 'gloss-fallback',
      normalization: normalizedInput,
      matches: glossMatches,
      annotateMatches: [],
      parallelMatches: glossMatches,
      fallbackMatches: [],
      suggestions: suggestionResult.suggestions || [],
    };
  }

  return {
    query: input,
    normalizedQuery: normalizedInput.canonical || normalizedInput.normalized || '',
    queryTokens: [],
    matchType: 'no-match',
    normalization: normalizedInput,
    matches: [],
    annotateMatches: [],
    parallelMatches: [],
    fallbackMatches: [],
    suggestions: suggestionResult.suggestions || [],
  };
}
