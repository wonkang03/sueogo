export const INPUT_NORMALIZATION_RULES = {
  whitespace: [
    { type: 'trim', description: '앞뒤 공백 제거' },
    { type: 'newline', description: '개행/엔터를 공백으로 변환' },
    { type: 'collapse-space', description: '연속 공백 1칸으로 정리' },
  ],
  punctuation: [
    { type: 'remove-basic-punctuation', description: '기본 문장부호 제거' },
    { type: 'normalize-symbol-variants', description: 'ㅋㅋ/ㅎㅎ/ㅠㅠ 같은 감탄·반복 기호 정리' },
  ],
  typoAliases: {
    잇어: '있어',
    잇어요: '있어요',
    업어: '없어',
    업어요: '없어요',
    머해: '뭐해',
    머함: '뭐함',
    머야: '뭐야',
    멀까: '뭘까',
    안뇽: '안녕',
    고마웡: '고마워',
    고마어: '고마워',
    괜찬아: '괜찮아',
    괜찬아요: '괜찮아요',
    어딧어: '어디있어',
    어딨어: '어디 있어',
    어딧어요: '어디있어요',
    잇냐: '있냐',
    라거: '라고',
    머: '뭐',
    먼: '뭔',
    웨: '왜',
    되여: '돼요',
    되요: '돼요',
    왠: '웬',
    '잇어?': '있어',
    먹을께요: '먹을게요',
    먹을꺼에요: '먹을거에요',
    먹을꺼예요: '먹을거예요',
    재밌어: '재미있어',
    재밌어요: '재미있어요',
    재밌다: '재미있다',
    재밌니: '재미있니',
    재밌었어: '재미있었어',
    재밌었어요: '재미있었어요',
    재밌었니: '재미있었니',
  },
  phraseAliases: {
    '뭐 하고 있어': '뭐해',
    '뭐 하고 있니': '뭐해',
    '뭐 하고 있어요': '뭐해요',
    '밖에 잇어': '밖에 있어',
    '어디 잇어': '어디 있어',
    '머 하고 있어': '뭐해',
    '뭐 하는 중이야': '뭐해',
    '뭐하는 중이야': '뭐해',
    '뭐 하는 중이에요': '뭐해요',
    '고마워요요': '고마워요',
    '먹을게요': '먹다',
    '먹을거에요': '먹다',
    '먹을거예요': '먹다',
    '먹을래요': '먹다',
    '먹을래': '먹다',
    '먹을까요': '먹다',
    '먹을까': '먹다',
    '먹었어': '먹다',
    '먹었어요': '먹다',
    '먹어요': '먹다',
    '먹어': '먹다',
    '재미있니': '재미있다',
    '재미있었니': '재미있다',
    '재미있었어': '재미있다',
    '재미있었어요': '재미있다',
    '재미있어요': '재미있다',
    '재미있어': '재미있다',
  },
  typoPatterns: [
    { pattern: /잇어/g, replace: '있어' },
    { pattern: /잇어요/g, replace: '있어요' },
    { pattern: /잇었/g, replace: '있었' },
    { pattern: /잇는/g, replace: '있는' },
    { pattern: /잇을/g, replace: '있을' },
    { pattern: /잇어서/g, replace: '있어서' },
    { pattern: /업서/g, replace: '없어' },
    { pattern: /업어요/g, replace: '없어요' },
    { pattern: /안뇽/g, replace: '안녕' },
    { pattern: /머([해야함임지])/g, replace: '뭐$1' },
    { pattern: /([가-힣])요요+/g, replace: '$1요' },
    { pattern: /([가-힣])용$/g, replace: '$1요' },
    { pattern: /([가-힣])염$/g, replace: '$1요' },
    { pattern: /([가-힣])욤$/g, replace: '$1요' },
  ],
  spacingPatterns: [
    { pattern: /뭐하/g, replace: '뭐 하' },
    { pattern: /어디있/g, replace: '어디 있' },
    { pattern: /할수/g, replace: '할 수' },
    { pattern: /갈수/g, replace: '갈 수' },
    { pattern: /볼수/g, replace: '볼 수' },
    { pattern: /해볼수/g, replace: '해볼 수' },
    { pattern: /해줄수/g, replace: '해줄 수' },
    { pattern: /보여줄수/g, replace: '보여줄 수' },
    { pattern: /뭐먹/g, replace: '뭐 먹' },
    { pattern: /하고왔/g, replace: '하고 왔' },
    { pattern: /하고와/g, replace: '하고 와' },
    { pattern: /먹고왔/g, replace: '먹고 왔' },
    { pattern: /먹고와/g, replace: '먹고 와' },
    { pattern: /자고왔/g, replace: '자고 왔' },
    { pattern: /자고와/g, replace: '자고 와' },
    { pattern: /놀고왔/g, replace: '놀고 왔' },
    { pattern: /놀고와/g, replace: '놀고 와' },
    { pattern: /갔다왔/g, replace: '갔다 왔' },
    { pattern: /갔다와/g, replace: '갔다 와' },
    { pattern: /왔다갔/g, replace: '왔다 갔' },
    { pattern: /산책하고/g, replace: '산책 하고' },
    { pattern: /공부하고/g, replace: '공부 하고' },
    { pattern: /운동하고/g, replace: '운동 하고' },
  ],
  endingPatterns: [
    { pattern: /(?:해줘요|해주세요|해주세여)$/g, replace: '해줘' },
    { pattern: /(?:보여줘요|보여주세요|보여주세여)$/g, replace: '보여줘' },
    { pattern: /(?:알려줘요|알려주세요|알려주세여)$/g, replace: '알려줘' },
  ],
};

const BASIC_REMOVE_RE = /["'“”‘’.,!?{}<>~]/g;
const BASIC_SPACE_RE = /[()\[\]:%/\\]/g;
const REPEATED_CHAR_RE = /(ㅋ|ㅎ|ㅠ|ㅜ|!|\?){2,}/g;
const SEMANTIC_TOKEN_PATTERNS = [
  { pattern: /먹(?:었|을|어|고)?(?:다|요|어|어요|게요|께요|래요|래|까요|까|거예요|거에요|꺼예요|꺼에요)?$/u, outputs: ['먹다'] },
  { pattern: /가(?:요|다|자|고|서|려|려요|려고|볼까|볼까요|볼래|볼래요|겠어|겠어요|겠습니?다|았|었|ㄹ까|을까|ㄹ게요|을게요)?$/u, outputs: ['가다'] },
  { pattern: /왔(?:다|어|어요|네|네요)?$/u, outputs: ['왔다'] },
  { pattern: /오(?:다|요|자|고|네|네요|려|려요|려고|겠어|겠어요|ㄹ까|을까|ㄹ게요|을게요)?$/u, outputs: ['오다'] },
  { pattern: /보(?:다|고|자|요|아|아요|어|어요|았|었|ㄹ까|을까|ㄹ게요|을게요|ㄹ래|을래|ㄹ래요|을래요)?$/u, outputs: ['보다'] },
  { pattern: /했(?:다|어|어요|네|네요)?$/u, outputs: ['하다'] },
  { pattern: /하(?:다|자|요|여|여요|겠어|겠어요|ㄹ까|을까|ㄹ게요|을게요|ㄹ래요|을래요)?$/u, outputs: ['하다'] },
  { pattern: /배고파(?:요)?$/u, outputs: ['배고프다'] },
  { pattern: /아파(?:요)?$/u, outputs: ['아프다'] },
  { pattern: /좋아(?:요)?$/u, outputs: ['좋다'] },
  { pattern: /싫어(?:요)?$/u, outputs: ['싫다'] },
  { pattern: /괜찮아(?:요)?$/u, outputs: ['괜찮다'] },
  { pattern: /졸려(?:요)?$/u, outputs: ['졸리다'] },
  { pattern: /힘들어(?:요)?$/u, outputs: ['힘들다'] },
  { pattern: /심심해(?:요)?$/u, outputs: ['심심하다'] },
  { pattern: /재미있(?:니|었니|었어|었어요|어|어요|다)?$/u, outputs: ['재미있다'] },
  { pattern: /맛있(?:어|어요|다)?$/u, outputs: ['맛있다'] },
  { pattern: /없어(?:요)?$/u, outputs: ['없다'] },
  { pattern: /있어(?:요)?$/u, outputs: ['있다'] },
];
const NEGATION_PREFIXES = ['안', '못'];

export function normalizeTextBasic(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\r?\n+/g, ' ')
    .replace(REPEATED_CHAR_RE, ' ')
    .replace(BASIC_REMOVE_RE, ' ')
    .replace(BASIC_SPACE_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceByDictionary(text = '', dict = {}) {
  if (!text) return text;
  return text
    .split(' ')
    .map((token) => dict[token] || token)
    .join(' ');
}

function replaceByPatterns(text = '', patterns = []) {
  let result = text;
  for (const { pattern, replace } of patterns) {
    result = result.replace(pattern, replace);
  }
  return result;
}

function inferSemanticOutputs(token = '') {
  const results = new Set();
  for (const rule of SEMANTIC_TOKEN_PATTERNS) {
    if (!rule.pattern.test(token)) continue;
    for (const output of rule.outputs) {
      if (output) results.add(output);
    }
  }
  return [...results];
}

function buildNegationVariants(text = '') {
  if (!text) return [];

  const tokens = text.split(/\s+/).filter(Boolean);
  const variants = new Set();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (NEGATION_PREFIXES.includes(token) && tokens[index + 1]) {
      const nextToken = tokens[index + 1];
      const outputs = inferSemanticOutputs(nextToken);
      for (const output of outputs) {
        const replaced = [...tokens];
        replaced.splice(index, 2, `${token}${output}`);
        variants.add(replaced.join(' '));
        variants.add(`${output} ${token === '못' ? '불능' : '부정'}`);
      }
      continue;
    }

    for (const prefix of NEGATION_PREFIXES) {
      if (!token.startsWith(prefix) || token.length <= prefix.length) continue;
      const remainder = token.slice(prefix.length);
      const outputs = inferSemanticOutputs(remainder);
      for (const output of outputs) {
        const replaced = [...tokens];
        replaced[index] = `${prefix}${output}`;
        variants.add(replaced.join(' '));
        variants.add(`${output} ${prefix === '못' ? '불능' : '부정'}`);
      }
    }
  }

  return [...variants];
}

export function normalizeKoreanInput(value = '') {
  const basic = normalizeTextBasic(value);
  if (!basic) {
    return {
      raw: value,
      normalized: '',
      canonical: '',
      variants: [],
      appliedRules: [],
    };
  }

  const appliedRules = [];
  let canonical = basic;

  const phraseMatched = INPUT_NORMALIZATION_RULES.phraseAliases[canonical];
  if (phraseMatched) {
    canonical = phraseMatched;
    appliedRules.push(`phrase:${basic}->${canonical}`);
  }

  const spacingFixed = replaceByPatterns(canonical, INPUT_NORMALIZATION_RULES.spacingPatterns);
  if (spacingFixed !== canonical) {
    appliedRules.push(`spacing:${canonical}->${spacingFixed}`);
    canonical = spacingFixed;
  }

  let typoFixed = replaceByDictionary(canonical, INPUT_NORMALIZATION_RULES.typoAliases);
  typoFixed = replaceByPatterns(typoFixed, INPUT_NORMALIZATION_RULES.typoPatterns);
  if (typoFixed !== canonical) {
    appliedRules.push(`typo:${canonical}->${typoFixed}`);
    canonical = typoFixed;
  }

  const endingFixed = replaceByPatterns(canonical, INPUT_NORMALIZATION_RULES.endingPatterns);
  if (endingFixed !== canonical) {
    appliedRules.push(`ending:${canonical}->${endingFixed}`);
    canonical = endingFixed;
  }

  const negationVariants = buildNegationVariants(canonical);
  const variants = Array.from(new Set([
    basic,
    canonical,
    basic.replace(/\s+/g, ''),
    canonical.replace(/\s+/g, ''),
    ...negationVariants,
    ...negationVariants.map((item) => item.replace(/\s+/g, '')),
  ].filter(Boolean)));

  return {
    raw: value,
    normalized: basic,
    canonical,
    variants,
    appliedRules,
  };
}

export function expandMeaningTokens(value = '') {
  const normalized = normalizeTextBasic(value);
  if (!normalized) return [];

  const results = new Set();
  const tokens = normalized.split(/\s+/).filter(Boolean);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.length >= 2) results.add(token);

    for (const output of inferSemanticOutputs(token)) {
      if (output) results.add(output);
    }

    if (NEGATION_PREFIXES.includes(token) && tokens[index + 1]) {
      const nextOutputs = inferSemanticOutputs(tokens[index + 1]);
      for (const output of nextOutputs) {
        results.add(output);
        results.add('부정');
        results.add(token === '못' ? '불능' : '부정');
        results.add(`${token}:${output}`);
      }
      continue;
    }

    for (const prefix of NEGATION_PREFIXES) {
      if (!token.startsWith(prefix) || token.length <= prefix.length) continue;
      const remainder = token.slice(prefix.length);
      for (const output of inferSemanticOutputs(remainder)) {
        results.add(output);
        results.add('부정');
        results.add(prefix === '못' ? '불능' : '부정');
        results.add(`${prefix}:${output}`);
      }
    }
  }

  return [...results].filter(Boolean);
}

export function buildKoreanTextSearchKeys(value = '') {
  const { normalized, canonical, variants } = normalizeKoreanInput(value);
  return Array.from(new Set([
    normalized,
    canonical,
    ...variants,
    ...expandMeaningTokens(canonical || normalized || value),
  ].filter(Boolean)));
}
