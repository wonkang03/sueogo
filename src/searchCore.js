import { expandMeaningTokens, normalizeKoreanInput, normalizeTextBasic } from './normalizeKoreanInput.js';

const KOREAN_PARTICLES = [
  '은', '는', '이', '가', '을', '를', '에', '에서', '에게', '께', '한테', '와', '과', '랑', '으로', '로', '도', '만', '이나', '나', '처럼', '보다', '부터', '까지', '밖에', '마저', '조차', '인데', '이다', '입니다', '예요', '이에요', '하고',
];

const KOREAN_ENDINGS = ['요', '죠', '네요', '군요', '습니다', '습니까', '어요', '아요', '여요', '했다', '한다', '해요', '했어요'];
const QUESTION_HINTS = ['뭐', '무엇', '왜', '어디', '언제', '누구', '어떻게', '몇', '인가', '나요', '까요', '습니까'];
const QUESTION_FALLBACK_RULES = [
  { key: 'location', hints: ['어디', '어딨', '어딨어', '어디예', '어디에'], concepts: ['location', 'question_place'] },
  { key: 'reason', hints: ['왜'], concepts: [] },
  { key: 'what', hints: ['뭐', '무엇', '뭔'], concepts: [] },
  { key: 'who', hints: ['누구'], concepts: [] },
  { key: 'when', hints: ['언제'], concepts: ['time'] },
  { key: 'how', hints: ['어떻게'], concepts: [] },
];
const GREETING_HINTS = ['안녕', '안녕하세요', '반갑'];
const THANKS_HINTS = ['감사', '고맙'];
const FOOD_HINTS = ['햄버거', '밥', '음식', '식사', '먹', '배고프', '배고파', '맛있', '배달', '점심', '저녁', '아침'];
const LOCATION_HINTS = ['어디', '위치', '장소', '병원', '학교', '화장실', '길'];
const WANT_HINTS = ['싶', '원하', '필요', '줘', '주세요'];
const FEELING_HINTS = ['아프', '힘들', '좋', '싫', '행복', '슬프', '배고프', '배고파'];
const WEATHER_HINTS = ['날씨', '비', '눈', '맑', '흐리', '춥', '덥', '쌀쌀', '바람'];
const TIME_HINTS = ['지금', '새벽', '아침', '밤', '저녁', '오전', '오후', '시간', '시'];
const SEMANTIC_PHRASE_RULES = [
  { hints: ['먹고싶', '먹고 싶'], concepts: ['desire_food', 'food', 'eat', 'hunger', 'meal'] },
  { hints: ['배고프', '배고파'], concepts: ['desire_food', 'food', 'eat', 'hunger', 'meal'] },
  { hints: ['햄버거', '피자', '치킨', '떡볶이'], concepts: ['food', 'meal', 'eat'] },
  { hints: ['맛있'], concepts: ['food', 'taste', 'eat'] },
  { hints: ['병원'], concepts: ['location', 'medical', 'visit'] },
  { hints: ['학교'], concepts: ['location', 'school', 'study', 'visit'] },
  { hints: ['어디'], concepts: ['location', 'question_place'] },
  { hints: ['날씨'], concepts: ['weather', 'question_weather'] },
  { hints: ['춥', '덥', '쌀쌀', '비', '눈'], concepts: ['weather'] },
  { hints: ['새벽'], concepts: ['time', 'dawn', 'night_morning'] },
  { hints: ['아침'], concepts: ['time', 'morning', 'night_morning'] },
  { hints: ['밤', '야간'], concepts: ['time', 'night', 'night_morning'] },
  { hints: ['오전', '오후', '시간', '시'], concepts: ['time', 'clock'] },
  { hints: ['지금'], concepts: ['current_time', 'time'] },
  { hints: ['안녕', '반갑'], concepts: ['greeting', 'social'] },
  { hints: ['감사', '고맙'], concepts: ['thanks', 'social'] },
  { hints: ['아프'], concepts: ['feeling', 'medical'] },
  { hints: ['가고 싶', '가고싶'], concepts: ['desire_move', 'move', 'visit'] },
  { hints: ['원하', '필요', '싶'], concepts: ['desire'] },
  { hints: ['먹'], concepts: ['eat', 'food'] },
  { hints: ['가'], concepts: ['move', 'visit'] },
  { hints: ['공부'], concepts: ['study', 'school'] },
];
const INTENT_RULES = [
  { key: 'greeting', hints: GREETING_HINTS, fallbackHints: ['안녕하세요', '반갑', '안녕'] },
  { key: 'thanks', hints: THANKS_HINTS, fallbackHints: ['감사', '고맙'] },
  { key: 'food', hints: FOOD_HINTS, fallbackHints: ['먹', '배고프', '맛있', '식사', '음식'] },
  { key: 'location', hints: LOCATION_HINTS, fallbackHints: ['어디', '위치', '병원', '학교', '화장실'] },
  { key: 'desire', hints: WANT_HINTS, fallbackHints: ['싶', '원하', '필요'] },
  { key: 'feeling', hints: FEELING_HINTS, fallbackHints: ['아프', '힘들', '좋', '배고프'] },
  { key: 'weather', hints: WEATHER_HINTS, fallbackHints: ['날씨', '춥', '덥', '비', '눈', '맑'] },
  { key: 'time', hints: TIME_HINTS, fallbackHints: ['지금', '새벽', '아침', '밤', '오전', '오후', '시간'] },
];
const BLOCKED_TOPIC_HINTS = ['소음', '민원', '고장', '환불', '접수', '상담', '부서', '택배', '결제', '기사님', '수리'];
const STRICT_INTENT_GROUPS = {
  greeting: ['greeting', 'social'],
  thanks: ['thanks', 'social'],
  food: ['food', 'eat', 'meal', 'taste', 'hunger', 'desire_food'],
  location: ['location', 'question_place', 'medical', 'school', 'visit'],
  weather: ['weather', 'question_weather'],
  time: ['time', 'clock', 'dawn', 'morning', 'night', 'night_morning', 'current_time'],
};
const CLOCK_EXPRESSION_RE = /(\d+\s*시(?:\s*\d+\s*분)?)|(한\s*시|두\s*시|세\s*시|네\s*시|다섯\s*시|여섯\s*시|일곱\s*시|여덟\s*시|아홉\s*시|열\s*시|열한\s*시|열두\s*시)|오전|오후|자정|정오/;

export function normalizeText(value = '') {
  const normalized = normalizeKoreanInput(value);
  return normalized.canonical || normalized.normalized || normalizeTextBasic(value);
}

export function stripKoreanSuffix(token = '') {
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

export function tokenizeKoreanText(value = '') {
  const normalized = normalizeText(value);
  const baseTokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const expanded = [];
  for (const token of baseTokens) {
    expanded.push(token);
    const stripped = stripKoreanSuffix(token);
    if (stripped && stripped.length >= 2 && stripped !== token) {
      expanded.push(stripped);
    }
  }

  expanded.push(...expandMeaningTokens(normalized));
  return Array.from(new Set(expanded.filter((token) => token && token.length >= 1)));
}

export function overlapCount(a = [], b = []) {
  const setB = new Set(b);
  return a.filter((token) => setB.has(token)).length;
}

function includesAny(text = '', hints = []) {
  return hints.some((hint) => text.includes(hint));
}

function extractSemanticConcepts(normalizedText = '', tokens = []) {
  const concepts = new Set();

  for (const rule of SEMANTIC_PHRASE_RULES) {
    const matched = rule.hints.some((hint) => normalizedText.includes(hint) || tokens.some((token) => token.includes(hint) || hint.includes(token)));
    if (matched) {
      for (const concept of rule.concepts) concepts.add(concept);
    }
  }

  return Array.from(concepts);
}

function classifyIntents(normalizedQuery = '', queryTokens = []) {
  const active = INTENT_RULES.filter((rule) => includesAny(normalizedQuery, rule.hints) || queryTokens.some((token) => rule.hints.some((hint) => token.includes(hint) || hint.includes(token))));
  return {
    activeKeys: active.map((rule) => rule.key),
    fallbackHints: Array.from(new Set(active.flatMap((rule) => rule.fallbackHints))),
    concepts: extractSemanticConcepts(normalizedQuery, queryTokens),
  };
}

function classifyQuery(query = '', normalizedQuery = '', queryTokens = []) {
  const intents = classifyIntents(normalizedQuery, queryTokens);
  const primaryIntent = intents.activeKeys[0] || '';
  return {
    isQuestion: /\?$/.test(query.trim()) || includesAny(normalizedQuery, QUESTION_HINTS),
    isGreeting: includesAny(normalizedQuery, GREETING_HINTS),
    isThanks: includesAny(normalizedQuery, THANKS_HINTS),
    requiresClockExpression: CLOCK_EXPRESSION_RE.test(query) || CLOCK_EXPRESSION_RE.test(normalizedQuery),
    queryLength: normalizedQuery.length,
    tokenCount: queryTokens.length,
    intents,
    primaryIntent,
  };
}

function classifyItem(item) {
  const normalizedText = item.normalizedText || normalizeText(item.text || '');
  const tokens = item.tokens || [];
  return {
    isQuestionLike: includesAny(normalizedText, QUESTION_HINTS),
    isGreetingLike: includesAny(normalizedText, GREETING_HINTS),
    isThanksLike: includesAny(normalizedText, THANKS_HINTS),
    hasClockExpression: CLOCK_EXPRESSION_RE.test(item.text || '') || CLOCK_EXPRESSION_RE.test(normalizedText),
    textLength: normalizedText.length,
    tokenCount: tokens.length,
    intents: classifyIntents(normalizedText, tokens),
    concepts: extractSemanticConcepts(normalizedText, tokens),
  };
}

function hasBlockedTopicMismatch(queryMeta, normalizedText = '', itemMeta = {}) {
  if (!queryMeta.primaryIntent) return false;
  const hasBlockedTopic = BLOCKED_TOPIC_HINTS.some((hint) => normalizedText.includes(hint));
  if (!hasBlockedTopic) return false;
  if (queryMeta.primaryIntent === 'time') return true;
  const strictGroup = STRICT_INTENT_GROUPS[queryMeta.primaryIntent] || [];
  const hasStrictConcept = strictGroup.some((concept) => itemMeta.concepts?.includes(concept));
  return !hasStrictConcept;
}

export function scoreTextMatch(item, normalizedQuery, queryTokens, queryMeta) {
  let score = 0;
  const normalizedText = item.normalizedText || normalizeText(item.text || '');
  const itemMeta = classifyItem(item);
  const exact = normalizedText === normalizedQuery;
  const startsWith = normalizedText.startsWith(normalizedQuery);
  const includes = normalizedText.includes(normalizedQuery);
  const tokenHits = overlapCount(queryTokens, item.tokens || []);
  const looseTokenHits = queryTokens.filter((token) => normalizedText.includes(token)).length;
  const fullyCovered = queryTokens.length > 0 && tokenHits === queryTokens.length;
  const tokenCoverage = queryTokens.length ? tokenHits / queryTokens.length : 0;
  const lengthGap = Math.abs((itemMeta.tokenCount || 0) - queryMeta.tokenCount);

  if (exact) score += 1700;
  if (startsWith) score += 440;
  if (includes) score += 240;
  if (tokenHits > 0) score += tokenHits * 220;
  if (looseTokenHits > tokenHits) score += (looseTokenHits - tokenHits) * 60;
  if (fullyCovered) score += 280;
  score += Math.max(0, 180 - itemMeta.textLength);
  score -= lengthGap * 40;

  if (queryMeta.isQuestion && itemMeta.isQuestionLike) score += 120;
  if (queryMeta.isQuestion && !itemMeta.isQuestionLike) score -= 80;
  if (queryMeta.isGreeting && itemMeta.isGreetingLike) score += 220;
  if (queryMeta.isGreeting && !itemMeta.isGreetingLike) score -= 120;
  if (queryMeta.isThanks && itemMeta.isThanksLike) score += 220;
  if (queryMeta.isThanks && !itemMeta.isThanksLike) score -= 120;

  const sharedIntents = queryMeta.intents.activeKeys.filter((key) => itemMeta.intents.activeKeys.includes(key)).length;
  const missingIntentPenalty = queryMeta.intents.activeKeys.length > 0 && sharedIntents === 0 ? 140 : 0;
  score += sharedIntents * 140;
  score -= missingIntentPenalty;

  const sharedConcepts = queryMeta.intents.concepts.filter((concept) => itemMeta.concepts.includes(concept)).length;
  const conceptCoverage = queryMeta.intents.concepts.length ? sharedConcepts / queryMeta.intents.concepts.length : 0;
  score += sharedConcepts * 110;
  if (queryMeta.intents.concepts.length > 0 && sharedConcepts === 0) score -= 160;

  const fallbackHintHits = queryMeta.intents.fallbackHints.filter((hint) => normalizedText.includes(hint)).length;
  score += fallbackHintHits * 70;

  const blockedTopicMismatch = hasBlockedTopicMismatch(queryMeta, normalizedText, itemMeta);
  if (blockedTopicMismatch) score -= 520;

  const specificPhraseBoost = (
    (normalizedQuery.includes('새벽') && normalizedText.includes('새벽') ? 420 : 0)
    + (normalizedQuery.includes('아침') && normalizedText.includes('아침') ? 260 : 0)
    + ((normalizedQuery.includes('1시') || normalizedQuery.includes('한시')) && (normalizedText.includes('한 시') || normalizedText.includes('1시') || normalizedText.includes('오전')) ? 240 : 0)
  );
  score += specificPhraseBoost;

  if (normalizedQuery.includes('새벽') && normalizedText.includes('지금은') && !normalizedText.includes('새벽') && !normalizedText.includes('밤') && !normalizedText.includes('아침')) {
    score -= 180;
  }

  return {
    score,
    exact,
    startsWith,
    includes,
    tokenHits,
    looseTokenHits,
    fullyCovered,
    tokenCoverage,
    lengthGap,
    itemMeta,
    sharedIntents,
    sharedConcepts,
    conceptCoverage,
    fallbackHintHits,
    blockedTopicMismatch,
    specificPhraseBoost,
  };
}

function rerankWithIntentFallback(matches, queryMeta) {
  if (!queryMeta.intents.activeKeys.length) return matches.filter((item) => !item.blockedTopicMismatch);

  return matches
    .map((item) => {
      let fallbackBoost = 0;
      const sharedIntents = item.sharedIntents || 0;
      if (sharedIntents > 0) fallbackBoost += sharedIntents * 120;
      if ((item.sharedConcepts || 0) > 0) fallbackBoost += item.sharedConcepts * 140;
      if ((item.fallbackHintHits || 0) > 0) fallbackBoost += item.fallbackHintHits * 40;
      if (queryMeta.intents.activeKeys.includes('food') && item.text.includes('배고프')) fallbackBoost += 220;
      if (queryMeta.intents.activeKeys.includes('food') && item.text.includes('먹')) fallbackBoost += 180;
      if (queryMeta.intents.activeKeys.includes('desire') && (item.text.includes('싶') || item.text.includes('원하') || item.text.includes('필요'))) fallbackBoost += 120;
      if (queryMeta.intents.activeKeys.includes('weather') && (item.text.includes('날씨') || item.text.includes('춥') || item.text.includes('덥') || item.text.includes('쌀쌀') || item.text.includes('비') || item.text.includes('눈'))) fallbackBoost += 220;
      if (queryMeta.intents.activeKeys.includes('location') && item.text.includes('병원')) fallbackBoost += 220;
      if (queryMeta.intents.activeKeys.includes('location') && item.text.includes('어디')) fallbackBoost += 180;
      if (queryMeta.intents.activeKeys.includes('time') && (item.text.includes('새벽') || item.text.includes('아침') || item.text.includes('밤') || item.text.includes('오전') || item.text.includes('오후') || item.text.includes('한 시') || item.text.includes('시간') || item.text.includes('지금'))) fallbackBoost += 220;
      if (queryMeta.intents.concepts.includes('dawn') && item.text.includes('새벽')) fallbackBoost += 520;
      if (queryMeta.intents.concepts.includes('morning') && item.text.includes('아침')) fallbackBoost += 260;
      if (queryMeta.intents.concepts.includes('clock') && (item.text.includes('한 시') || item.text.includes('1시') || item.text.includes('오전'))) fallbackBoost += 220;
      if (queryMeta.intents.concepts.includes('desire_food') && item.conceptCoverage >= 0.5) fallbackBoost += 260;
      if (queryMeta.intents.concepts.includes('question_weather') && item.conceptCoverage >= 0.5) fallbackBoost += 180;
      if (queryMeta.intents.concepts.includes('night_morning') && item.conceptCoverage >= 0.4) fallbackBoost += 180;
      if (queryMeta.intents.concepts.includes('clock') && item.conceptCoverage >= 0.3) fallbackBoost += 140;
      if (item.blockedTopicMismatch) fallbackBoost -= 600;
      return { ...item, fallbackBoost };
    })
    .filter((item) => !item.blockedTopicMismatch)
    .sort((a, b) => (
      (b.score + (b.fallbackBoost || 0)) - (a.score + (a.fallbackBoost || 0))
      || b.score - a.score
      || b.tokenHits - a.tokenHits
      || a.itemMeta.textLength - b.itemMeta.textLength
    ));
}

function buildParallelMatches(parallelIndex, normalizedQuery, queryTokens, queryMeta) {
  const baseMatches = parallelIndex
    .map((item) => {
      const match = scoreTextMatch(item, normalizedQuery, queryTokens, queryMeta);
      const score = match.score + (item.dataset === 'parallel_ko_2024' ? 30 : 0);

      return {
        ...item,
        ...match,
        score,
        playbackMode: 'parallel',
        resultType: 'parallel_only',
        selectionBoost: 0,
      };
    })
    .filter((item) => {
      if (item.score <= 180 || item.blockedTopicMismatch) return false;
      if (queryMeta.primaryIntent === 'time' && queryMeta.requiresClockExpression) {
        return item.itemMeta?.hasClockExpression && (item.tokenHits > 0 || item.looseTokenHits > 0);
      }
      return true;
    });

  return rerankWithIntentFallback(baseMatches, queryMeta);
}

function dedupeMatches(items) {
  const seen = new Set();
  const results = [];

  for (const item of items) {
    const key = `${item.resultType}:${item.folderId}:${item.text}:${item.start}:${item.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }

  return results;
}

function buildQuestionFallbackCandidates(parallelIndex, normalizedQuery, queryMeta) {
  if (!queryMeta.isQuestion) return [];

  const matchedRule = QUESTION_FALLBACK_RULES.find((rule) => rule.hints.some((hint) => normalizedQuery.includes(hint)));
  if (!matchedRule) return [];

  return dedupeMatches(parallelIndex
    .map((item) => {
      const normalizedText = item.normalizedText || normalizeText(item.text || '');
      const itemMeta = classifyItem(item);
      let score = 0;

      if (itemMeta.isQuestionLike) score += 220;
      score += matchedRule.hints.filter((hint) => normalizedText.includes(hint)).length * 260;

      const sharedConcepts = matchedRule.concepts.length
        ? matchedRule.concepts.filter((concept) => itemMeta.concepts.includes(concept)).length
        : 0;
      score += sharedConcepts * 180;

      if (matchedRule.key === 'location' && (normalizedText.includes('어디') || normalizedText.includes('위치'))) score += 220;
      if (matchedRule.key === 'reason' && normalizedText.includes('왜')) score += 220;
      if (matchedRule.key === 'what' && (normalizedText.includes('뭐') || normalizedText.includes('무엇'))) score += 220;
      if (matchedRule.key === 'who' && normalizedText.includes('누구')) score += 220;
      if (matchedRule.key === 'when' && (normalizedText.includes('언제') || normalizedText.includes('시간'))) score += 220;
      if (matchedRule.key === 'how' && normalizedText.includes('어떻게')) score += 220;

      const tokenPenalty = Math.max(0, item.tokens?.length - 4) * 45;
      const textPenalty = Math.max(0, normalizedText.length - 12) * 12;
      score -= tokenPenalty + textPenalty;

      return score > 0 ? { ...item, fallbackQuestionScore: score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.fallbackQuestionScore - a.fallbackQuestionScore || a.text.length - b.text.length));
}

export function searchCorpusByInputCore({ input = '', parallelIndex = [] }) {
  const normalizedQuery = normalizeText(input);
  const queryTokens = tokenizeKoreanText(input);
  const queryMeta = classifyQuery(input, normalizedQuery, queryTokens);

  if (!normalizedQuery) {
    return {
      query: input,
      normalizedQuery,
      queryTokens,
      queryMeta,
      matches: [],
      annotateMatches: [],
      parallelMatches: [],
      suggestions: [],
    };
  }

  const parallelMatches = buildParallelMatches(parallelIndex, normalizedQuery, queryTokens, queryMeta)
    .filter((item) => {
      const totalScore = item.score + (item.fallbackBoost || 0);
      if (queryMeta.primaryIntent === 'time') return totalScore >= 2200;
      return totalScore >= 500;
    })
    .slice(0, 20);

  const fallbackCandidates = buildQuestionFallbackCandidates(parallelIndex, normalizedQuery, queryMeta);
  const directMatches = dedupeMatches(parallelMatches).slice(0, 20);
  const topDirect = directMatches[0] || null;
  const shouldUseQuestionFallback = Boolean(
    queryMeta.isQuestion
    && fallbackCandidates.length
    && (!topDirect || ((topDirect.tokenCoverage || 0) <= 0.5 && queryTokens.length > 1))
  );

  const matches = shouldUseQuestionFallback
    ? fallbackCandidates.slice(0, 1).map((item) => ({ ...item, usedQuestionFallback: true }))
    : directMatches;
  const suggestions = (shouldUseQuestionFallback ? fallbackCandidates.slice(0, 3) : (matches.length ? matches.slice(0, 3) : fallbackCandidates.slice(0, 3))).map((item) => ({
    text: item.text,
    source: item.source,
    topic: item.topic || item.dataset,
  }));

  return {
    query: input,
    normalizedQuery,
    queryTokens,
    queryMeta,
    matches,
    annotateMatches: [],
    parallelMatches: matches.slice(0, 10),
    suggestions,
  };
}
