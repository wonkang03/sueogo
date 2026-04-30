const BLOCK_MESSAGE = '자기소개 금지';

const PROFANITY_PATTERNS = [
  /바보/u,
  /멍청/u,
  /병신/u,
  /개새끼/u,
  /개색기/u,
  /개새/u,
  /새끼/u,
  /씨발/u,
  /시발/u,
  /썅/u,
  /쌍년/u,
  /미친놈/u,
  /미친년/u,
  /좆/u,
  /존나/u,
  /꺼져/u,
  /염병/u,
];

export function normalizeModerationText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/["'“”‘’.,!?()[\]{}<>~`@#$%^&*_+=|\\/:;-]/g, '');
}

export function moderateInput(value = '') {
  const normalized = normalizeModerationText(value);
  if (!normalized) {
    return { blocked: false, message: '', normalized };
  }

  const matched = PROFANITY_PATTERNS.find((pattern) => pattern.test(normalized));
  if (!matched) {
    return { blocked: false, message: '', normalized };
  }

  return {
    blocked: true,
    message: BLOCK_MESSAGE,
    normalized,
    reason: 'profanity',
  };
}

export { BLOCK_MESSAGE };
