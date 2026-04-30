<template>
  <div class="app-shell">
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>

    <main class="app-frame">
      <transition name="screen-fade" mode="out-in">
        <section v-if="currentPage === 'main'" key="main" class="page main-page">
          <section class="main-hero-wrap glass-card">
            <div class="hero-panel hero-panel-soft">
              <img src="/mainimage.jpg" alt="수어Go 메인 이미지" class="hero-image" />
            </div>
          </section>

          <section class="main-actions main-actions-row main-actions-soft">
            <button class="primary-button main-action-button compact-main-button" @click="goToPage('translate')">
              말뭉치 다운로드
            </button>
            <button class="secondary-button main-action-button translate-main-button" @click="goToPage('sign-translate')">
              채팅으로 수어 번역
            </button>
          </section>

          <section class="main-purpose-grid">
            <article class="purpose-card glass-card">
              <p class="section-label">FOR COMMUNICATION</p>
              <h3>국립국어원 API연계 9종 기반</h3>
              <p>국립국어원 수어 말뭉치와 API 연계 9종 데이터를 바탕으로 입력 문장에 맞는 수어 영상을 찾습니다.</p>
            </article>
            <article class="purpose-card glass-card">
              <p class="section-label">FOR TRUST</p>
              <h3>말뭉치 기반으로 정확하게</h3>
              <p>국립국어원 수어 말뭉치를 기반으로 검색하고, 근거가 있는 영상만 연결하도록 설계합니다.</p>
            </article>
          </section>
          <section class="main-slogan glass-card mission-card">
            <p>사회적 편견을 뛰어넘어</p>
            <p>소통의 벽이 허물어지는 날까지</p>
          </section>
        </section>

        <section v-else-if="currentPage === 'translate'" key="translate" class="page translate-page">
          <header class="page-header glass-card">
            <div class="header-left">
              <button class="icon-button back-button" @click="goToPage('main')" aria-label="메인으로 돌아가기">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>뒤로</span>
              </button>
              <div>
                <p class="section-label">DETAIL PAGE 01</p>
                <h2>국립국어원 수어 API 메타데이터 호출</h2>
              </div>
            </div>
            <div class="status-chip" :class="statusTone">{{ statusBadgeText }}</div>
          </header>

          <div class="content-grid">
            <section class="viewer-card glass-card">
              <div class="card-header">
                <div>
                  <p class="section-label">OPEN API METADATA</p>
                  <h3>{{ activeCorpusLabel ? `${activeCorpusLabel} 메타데이터 호출 결과` : '국립국어원 말뭉치 메타데이터 호출 화면' }}</h3>
                </div>
                <button v-if="downloadPageUrl" class="text-button" @click="resetAll">초기화</button>
              </div>

              <div class="video-stage">
                <div v-if="downloadPageUrl" class="download-result">
                  <div class="placeholder-icon">🧾</div>
                  <strong>{{ activeCorpusLabel }} 메타데이터 호출이 완료되었습니다</strong>
                  <p>{{ statusMessage }}</p>
                  <div class="download-actions multi-actions">
                    <a :href="downloadPageUrl" target="_blank" rel="noreferrer" class="primary-button download-link-button">
                      국립국어원 다운로드 페이지 열기
                    </a>
                  </div>
                  <div v-if="downloadFiles.length" class="download-file-preview">
                    <div class="download-file-preview-header">
                      <strong>확인된 파일 목록</strong>
                      <span>{{ downloadFileCount }}개</span>
                    </div>
                    <ul class="download-file-list">
                      <li v-for="file in downloadFiles" :key="file.id">
                        <span>{{ file.fileName }}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div v-else class="video-placeholder">
                  <div class="placeholder-icon">🤟</div>
                  <strong>{{ placeholderTitle }}</strong>
                  <p>{{ statusMessage }}</p>
                </div>
              </div>
            </section>

            <section class="translator-card glass-card">
              <div class="download-panel glass-subcard">
                <div class="upload-header">
                  <p class="section-label">KLI OPEN API</p>
                  <h3>코퍼스별 메타데이터 호출</h3>
                </div>
                <p class="helper-text">
                  각 버튼은 서로 다른 승인 인증키로 국립국어원 말뭉치 오픈 API를 호출합니다.
                  이 단계의 핵심은 말뭉치 메타데이터를 확인하는 것입니다.
                </p>
                <div class="corpus-button-list">
                  <button
                    v-for="corpus in corpora"
                    :key="corpus.type"
                    class="primary-button corpus-call-button"
                    @click="handleDownloadPageRequest(corpus)"
                    :disabled="isLoading"
                  >
                    {{ isLoading && activeCorpusType === corpus.type ? `${corpus.label} 호출 중...` : corpus.label }}
                  </button>
                </div>
              </div>

              <div class="upload-panel glass-subcard">
                <div class="upload-header">
                  <p class="section-label">DOWNLOADED CORPUS SUMMARY</p>
                  <h3>내려받은 자료 분석</h3>
                </div>
                <p class="helper-text">현재 앱 폴더에 들어있는 원시, 주석, 병렬 말뭉치 구조를 한 번에 확인할 수 있습니다.</p>
                <div class="analysis-grid analysis-grid-triple">
                  <article class="analysis-card">
                    <p class="analysis-label">원시 말뭉치</p>
                    <strong>{{ corpusAnalysis.farsightness.folders }}개 폴더</strong>
                    <span>JSON {{ corpusAnalysis.farsightness.json }}, MP4 {{ corpusAnalysis.farsightness.mp4 }}</span>
                    <small>샘플 {{ corpusAnalysis.farsightness.sample.join(', ') }}</small>
                  </article>
                  <article class="analysis-card">
                    <p class="analysis-label">주석 말뭉치</p>
                    <strong>{{ corpusAnalysis.annotate.folders }}개 폴더</strong>
                    <span>JSON {{ corpusAnalysis.annotate.json }}, EAF {{ corpusAnalysis.annotate.eaf }}, MP4 {{ corpusAnalysis.annotate.mp4 }}</span>
                    <small>세그먼트 {{ corpusAnalysis.annotate.segments }}</small>
                  </article>
                  <article class="analysis-card">
                    <p class="analysis-label">병렬 말뭉치</p>
                    <strong>{{ corpusAnalysis.parallel.folders }}개 폴더</strong>
                    <span>JSON {{ corpusAnalysis.parallel.json }}, EAF {{ corpusAnalysis.parallel.eaf }}, MP4 {{ corpusAnalysis.parallel.mp4 }}</span>
                    <small>세그먼트 {{ corpusAnalysis.parallel.segments }}</small>
                  </article>
                </div>
              </div>

              <div class="message-list" ref="chatBox">
                <div v-for="(msg, i) in messages" :key="i" :class="['message-row', msg.type]">
                  <div v-if="msg.type === 'bot'" class="bot-avatar">Go</div>
                  <div class="message-bubble">{{ msg.text }}</div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section v-else-if="currentPage === 'sign-translate'" key="sign-translate" class="page translate-page sign-translate-clean-page">
          <header class="page-header glass-card">
            <div class="header-left sign-translate-header-left">
              <button class="icon-button back-button" @click="goToPage('main')" aria-label="메인으로 돌아가기">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>뒤로</span>
              </button>
              <div class="sign-translate-title-wrap">
                <p class="section-label sign-translate-section-label">상세페이지</p>
                <h2 class="sign-translate-page-title">사회적 편견을 뛰어넘어 소통의 벽이 허물어지는 날까지</h2>
              </div>
            </div>
            <div class="status-chip" :class="translationStatusTone">{{ translationStatusText }}</div>
          </header>

          <section class="sign-translate-layout">
            <section class="viewer-card glass-card sign-player-card">
              <div class="card-header">
                <div>
                  <p class="section-label">SIGN VIDEO PLAYER</p>
                  <h3>{{ selectedResult ? selectedResult.text : '입력한 문장과 연결된 수어 영상' }}</h3>
                </div>
                <button v-if="selectedResult" class="text-button" @click="clearTranslationSelection">초기화</button>
              </div>

              <div class="video-stage clean-video-stage">
                <div v-if="selectedResult && selectedResult.videoUrl" class="translation-player-wrap">
                  <video ref="translationVideoRef" :src="selectedResult.videoUrl" controls preload="auto" playsinline class="sign-video" @loadedmetadata="handleTranslationVideoLoaded" @play="handleTranslationPlaybackPlay" @pause="handleTranslationPlaybackPause" @ended="handleTranslationPlaybackEnded" @waiting="handleTranslationPlaybackWaiting"></video>
                  <video ref="nextTranslationVideoRef" muted preload="auto" playsinline class="preload-video"></video>
                </div>
                <div v-else class="video-placeholder clean-video-placeholder">
                  <div class="placeholder-icon">🎬</div>
                  <strong>{{ translationPlaceholderTitle }}</strong>
                  <p :class="{ 'blocked-message': translationStatusMessage === '자기소개 금지' }">{{ translationStatusMessage }}</p>
                </div>
              </div>
            </section>

            <section class="translator-card glass-card sign-chat-card">
              <div class="sign-chat-header">
                <p class="section-label">TEXT TO SIGN</p>
                <h3>채팅을 입력하면 수어 영상을 찾아 재생합니다</h3>
                <p class="helper-text">
                  국립국어원 말뭉치 API연계 데이터 기반으로 수어를 재생합니다.
                </p>
              </div>

              <div class="translation-chat-log clean-chat-log">
                <div v-if="translationHistory.length === 0" class="empty-chat-state">
                  <div class="placeholder-icon">💬</div>
                  <strong>아직 입력한 문장이 없습니다</strong>
                  <p>예: 안녕하세요, 학교에 갔어요, 병원 어디예요</p>
                </div>
                <template v-else>
                  <div v-for="(entry, index) in translationHistory" :key="`${entry.query}-${index}`" class="translation-chat-entry">
                    <div class="translation-user-bubble">{{ entry.query }}</div>
                    <div class="translation-bot-bubble">
                      <strong>{{ entry.summary }}</strong>
                    </div>
                  </div>
                </template>
              </div>

              <div class="translation-input-wrap clean-input-wrap">
                <div class="translation-input-field-wrap">
                  <input
                    v-model="translationInput"
                    type="text"
                    class="translation-input"
                    :disabled="isTranslationInputLocked"
                    :placeholder="isTranslationInputLocked ? '영상 재생이 끝날 때까지 입력할 수 없습니다' : '예: 안녕하세요, 학교에 갔어요, 병원 어디예요'"
                    @keydown.enter="searchSignVideos"
                  />
                </div>
                <button class="primary-button translate-search-button" :disabled="isTranslationInputLocked" @click="searchSignVideos">전송</button>
              </div>

              <div v-if="translationSuggestions.length" class="suggestion-wrap clean-suggestion-wrap">
                <p class="analysis-label">유사 문장 추천</p>
                <div class="suggestion-list">
                  <button
                    v-for="item in translationSuggestions"
                    :key="`${item.source}-${item.text}`"
                    class="suggestion-chip"
                    :disabled="isTranslationInputLocked"
                    @click="handleSuggestionSelect(item)"
                  >
                    {{ item.text }}
                  </button>
                </div>
              </div>
              <div v-else-if="showNoSuggestionMessage" class="suggestion-wrap clean-suggestion-wrap empty-suggestion-wrap">
                <p class="analysis-label">유사 문장 추천</p>
                <p class="empty-suggestion-message">유사 추천 문장이 없습니다.</p>
              </div>
            </section>
          </section>
        </section>

        <section v-else key="learn" class="page learn-page">
          <header class="page-header glass-card">
            <div class="header-left">
              <button class="icon-button back-button" @click="goToPage('main')" aria-label="메인으로 돌아가기">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>뒤로</span>
              </button>
              <div>
                <p class="section-label">DETAIL PAGE 03</p>
                <h2>오늘의 수어 보기</h2>
              </div>
            </div>
            <div class="status-chip neutral">학습 모드</div>
          </header>

          <section class="learn-hero glass-card">
            <p class="section-label">DAILY SIGN CURATION</p>
            <h3>자주 쓰는 핵심 표현을 먼저 익혀보세요</h3>
            <p>
              실사용 빈도가 높은 표현을 우선 카드로 정리해두었습니다.
              이후 다운로드한 말뭉치 기반 학습으로 확장하기 좋은 구조입니다.
            </p>
          </section>

          <section class="learn-grid">
            <article class="learn-card glass-card" v-for="item in learnItems" :key="item.title">
              <div class="learn-icon">{{ item.emoji }}</div>
              <div>
                <p class="section-label">TODAY'S SIGN</p>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </article>
          </section>
        </section>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import axios from 'axios';
import { resolveSearchResultVideo, searchCorpusByInput } from './corpusData';
import { moderateInput } from './inputModeration';

const API_BASE_URL = '/api/sign-video';

const corpora = [
  { type: 'raw', label: '한국수어 원시 말뭉치' },
  { type: 'annotated', label: '한국수어 주석 말뭉치' },
  { type: 'parallel', label: '한국수어-한국어 병렬 말뭉치' },
  { type: 'parallelKoKsl2022', label: '한국어-한국수어 병렬 말뭉치 2022' },
  { type: 'annotated2024', label: '한국수어 주석 말뭉치 2024' },
  { type: 'raw2024', label: '한국수어 원시 말뭉치 2024' },
  { type: 'parallelKoKsl2023', label: '한국어-한국수어 병렬 말뭉치 2023' },
  { type: 'parallelKoKsl2024', label: '한국어-한국수어 병렬 말뭉치 2024' },
  { type: 'parallelKslKo2024', label: '한국수어-한국어 병렬 말뭉치 2024' },
];

const currentPage = ref('main');
const isLoading = ref(false);
const downloadPageUrl = ref('');
const activeCorpusType = ref('');
const activeCorpusLabel = ref('');
const downloadFiles = ref([]);
const downloadFileCount = ref(0);
const chatBox = ref(null);
const statusMessage = ref('호출할 말뭉치 버튼을 누르면 국립국어원 오픈 API 메타데이터 결과가 이곳에 표시됩니다.');
const statusMode = ref('idle');
const messages = ref([
  { text: '원하시는 말뭉치 버튼을 누르시면 해당 인증키로 국립국어원 오픈 API 메타데이터 호출 여부를 확인해드리겠습니다.', type: 'bot' },
]);

const translationInput = ref('');
const translationResults = ref([]);
const annotateResults = ref([]);
const parallelResults = ref([]);
const translationHistory = ref([]);
const translationSuggestions = ref([]);
const showNoSuggestionMessage = ref(false);
const selectedResult = ref(null);
const selectedResultKey = ref('');
const translationStatus = ref('idle');
const translationStatusMessage = ref('한글 문장을 입력하면 수어 번역 영상을 재생합니다.');
const translationVideoRef = ref(null);
const nextTranslationVideoRef = ref(null);
const isTranslationPlaybackPending = ref(false);
const isTranslationPlaybackActive = ref(false);
const TRANSLATION_PLAYBACK_RATE = 0.8;
const SEGMENT_START_PADDING_MS = 120;
const SEGMENT_END_PADDING_MS = 450;
const MIN_SEGMENT_DURATION_MS = 1400;
let activeTimeUpdateHandler = null;
let activePlaybackSegments = [];
let activePlaybackIndex = 0;

const learnItems = [
  { emoji: '👋', title: '안녕하세요', description: '기본 인사 표현으로 첫 학습 카드에 가장 적합한 표현입니다.' },
  { emoji: '🙏', title: '감사합니다', description: '일상 소통에서 활용 빈도가 높은 대표적인 표현입니다.' },
  { emoji: '🆘', title: '도와주세요', description: '실생활에서 빠르게 익혀두면 좋은 중요한 표현입니다.' },
  { emoji: '💙', title: '괜찮아요', description: '대화 중 안심과 배려를 전할 때 유용한 표현입니다.' },
];

const corpusAnalysis = {
  farsightness: {
    folders: 31,
    json: 31,
    mp4: 62,
    sample: ['VDOR1525020607', 'VDOR1525020812', 'VDOR1525021004'],
  },
  annotate: {
    folders: 8,
    json: 8,
    eaf: 8,
    mp4: 16,
    segments: 973,
    sample: ['VDMT1525020812', 'VDMT1525021004', 'VDMT1525021204'],
  },
  parallel: {
    folders: 23152,
    json: 23152,
    eaf: 0,
    mp4: 31496,
    segments: 23152,
    sample: ['SXPAKOKS220760950', 'SXPAKOKS220761050', 'SXPAKOKS220761150'],
  },
};

const statusBadgeText = computed(() => {
  if (statusMode.value === 'loading') return '호출 중';
  if (statusMode.value === 'success') return '정상';
  if (statusMode.value === 'error') return '오류';
  return '대기 중';
});

const statusTone = computed(() => {
  if (statusMode.value === 'loading') return 'loading';
  if (statusMode.value === 'success') return 'success';
  if (statusMode.value === 'error') return 'error';
  return 'neutral';
});

const placeholderTitle = computed(() => {
  if (statusMode.value === 'loading') return '메타데이터를 호출하는 중입니다';
  if (statusMode.value === 'error') return '메타데이터를 불러오지 못했습니다';
  return '메타데이터 호출 결과가 여기에 표시됩니다';
});

const translationStatusText = computed(() => {
  if (translationStatus.value === 'searching') return '검색 중';
  if (translationStatus.value === 'success') return '검색 완료';
  if (translationStatus.value === 'error') return '검색 실패';
  return '대기 중';
});

const translationStatusTone = computed(() => {
  if (translationStatus.value === 'searching') return 'loading';
  if (translationStatus.value === 'success') return 'success';
  if (translationStatus.value === 'error') return 'error';
  return 'neutral';
});

const translationPlaceholderTitle = computed(() => {
  if (translationStatus.value === 'searching') return '조합 가능한 수어 영상을 찾는 중입니다';
  if (translationStatus.value === 'error') return '재생 가능한 수어 영상을 찾지 못했습니다';
  return '수어 영상이 여기에 재생됩니다';
});

const isTranslationInputLocked = computed(() => (
  translationStatus.value === 'searching'
  || isTranslationPlaybackPending.value
  || isTranslationPlaybackActive.value
));

const goToPage = (page) => {
  if (currentPage.value === 'sign-translate' && page !== 'sign-translate') {
    clearTranslationSelection();
  }
  currentPage.value = page;
};

const resetAll = () => {
  downloadPageUrl.value = '';
  activeCorpusType.value = '';
  activeCorpusLabel.value = '';
  downloadFiles.value = [];
  downloadFileCount.value = 0;
  statusMode.value = 'idle';
  statusMessage.value = '호출할 말뭉치 버튼을 누르면 국립국어원 오픈 API 메타데이터 결과가 이곳에 표시됩니다.';
};

const clearTranslationSelection = () => {
  const video = translationVideoRef.value;
  if (video && activeTimeUpdateHandler) {
    video.removeEventListener('timeupdate', activeTimeUpdateHandler);
    activeTimeUpdateHandler = null;
  }

  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  clearPreloadedSegment();
  isTranslationPlaybackPending.value = false;
  isTranslationPlaybackActive.value = false;
  activePlaybackSegments = [];
  activePlaybackIndex = 0;
  translationInput.value = '';
  translationResults.value = [];
  annotateResults.value = [];
  parallelResults.value = [];
  translationSuggestions.value = [];
  translationHistory.value = [];
  selectedResult.value = null;
  selectedResultKey.value = '';
  translationStatus.value = 'idle';
  translationStatusMessage.value = '한글 문장을 입력하면 수어 번역 영상을 재생합니다.';
};

const formatMsRange = (start, end) => {
  const toClock = (value) => {
    const totalSeconds = Math.max(0, Math.floor((value || 0) / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return `${toClock(start)} ~ ${toClock(end)}`;
};

const normalizeKoreanText = (value = '') => String(value)
  .toLowerCase()
  .replace(/["'“”‘’.,!?()[\]{}<>]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stripKoreanSuffix = (token = '') => {
  const particles = ['은', '는', '이', '가', '을', '를', '에', '에서', '에게', '께', '한테', '와', '과', '랑', '으로', '로', '도', '만', '이나', '나'];
  const endings = ['요', '죠', '네요', '군요', '습니다', '습니까', '어요', '아요', '여요', '했다', '한다', '해요', '했어요'];
  let result = token;

  for (const ending of endings) {
    if (result.length > ending.length + 1 && result.endsWith(ending)) {
      result = result.slice(0, -ending.length);
      break;
    }
  }

  for (const particle of particles.sort((a, b) => b.length - a.length)) {
    if (result.length > particle.length + 1 && result.endsWith(particle)) {
      result = result.slice(0, -particle.length);
      break;
    }
  }

  return result;
};

const tokenizeMeaning = (value = '') => Array.from(new Set(
  normalizeKoreanText(value)
    .split(/\s+/)
    .map((token) => stripKoreanSuffix(token.trim()))
    .filter((token) => token.length >= 2)
));

const getSegmentVideoUrl = (segment = {}, fallbackUrl = '') => segment.videoUrl || fallbackUrl || '';

const preloadUpcomingSegment = (segment = null, fallbackUrl = '') => {
  const preloadVideo = nextTranslationVideoRef.value;
  const nextUrl = getSegmentVideoUrl(segment, fallbackUrl);
  if (!preloadVideo || !nextUrl) return;

  if (preloadVideo.dataset.preloadedSrc === nextUrl) return;
  preloadVideo.dataset.preloadedSrc = nextUrl;
  preloadVideo.src = nextUrl;
  preloadVideo.load();
};

const clearPreloadedSegment = () => {
  const preloadVideo = nextTranslationVideoRef.value;
  if (!preloadVideo) return;
  preloadVideo.pause();
  preloadVideo.removeAttribute('src');
  preloadVideo.dataset.preloadedSrc = '';
  preloadVideo.load();
};

const buildGlossMatchSummary = (result) => {
  const matched = Array.isArray(result?.matchedTokens) ? result.matchedTokens.filter(Boolean) : [];
  const missing = Array.isArray(result?.missingTokens) ? result.missingTokens.filter(Boolean) : [];

  const parts = [];
  parts.push(`수어고 매칭(단어: ${matched.length ? matched.join(', ') : '없음'})`);
  if (missing.length) {
    parts.push(`수어고 없는 단어(단어: ${missing.join(', ')})`);
  }
  return parts.join(' / ');
};

const buildTranslationSummary = (query, searchResult, result) => {
  const base = '수어고 매칭';
  if (result?.resultType === 'gloss-sequence') {
    return buildGlossMatchSummary(result);
  }

  if (!query || !result?.text) return `${base}(단어: ${query || ''})`;

  if (result.usedQuestionFallback) {
    return `${base}(유사문장: ${result.text})`;
  }

  if (result.resultType === 'parallel_koreanText_exact' || searchResult?.matchType === 'koreanText-exact') {
    return `${base}(문장: ${query})`;
  }

  if (result.text && result.text !== query) {
    return `${base}(유사문장: ${result.text})`;
  }

  return `${base}(문장: ${query})`;
};

const selectTranslationResult = async (item) => {
  const video = translationVideoRef.value;
  if (video && activeTimeUpdateHandler) {
    video.removeEventListener('timeupdate', activeTimeUpdateHandler);
    activeTimeUpdateHandler = null;
  }

  isTranslationPlaybackPending.value = true;
  isTranslationPlaybackActive.value = false;
  translationStatus.value = 'searching';
  translationStatusMessage.value = `수어 번역 영상을 불러오는 중입니다.`;

  const resolvedItem = await resolveSearchResultVideo(item);
  activePlaybackSegments = (Array.isArray(resolvedItem?.segments) && resolvedItem.segments.length
    ? resolvedItem.segments
    : [{
        videoKey: resolvedItem.videoKey,
        videoUrl: resolvedItem.videoUrl,
        start: resolvedItem.start,
        end: resolvedItem.end,
        tokens: resolvedItem.matchedTokens || [],
        glosses: resolvedItem.glosses || [],
      }]).map((segment) => {
        const paddedStart = Math.max(0, (segment.start || 0) - SEGMENT_START_PADDING_MS);
        const paddedEnd = Math.max((segment.start || 0), (segment.end || 0) + SEGMENT_END_PADDING_MS);
        return {
          ...segment,
          start: paddedStart,
          end: Math.max(paddedEnd, paddedStart + MIN_SEGMENT_DURATION_MS),
        };
      });
  activePlaybackIndex = 0;

  const firstSegment = activePlaybackSegments[0] || {};
  selectedResult.value = {
    ...resolvedItem,
    videoUrl: firstSegment.videoUrl || resolvedItem.videoUrl,
    start: firstSegment.start ?? resolvedItem.start,
    end: firstSegment.end ?? resolvedItem.end,
  };
  selectedResultKey.value = `${resolvedItem.corpus}-${resolvedItem.folderId}-${resolvedItem.start}-${resolvedItem.signerId}-${Date.now()}`;
  preloadUpcomingSegment(activePlaybackSegments[1], selectedResult.value.videoUrl);
  translationStatus.value = 'success';
  translationStatusMessage.value = resolvedItem.summary || `총 ${activePlaybackSegments.length}개 구간을 0.8배속으로 순서대로 재생합니다.`;
};

const handleTranslationPlaybackPlay = () => {
  isTranslationPlaybackPending.value = false;
  isTranslationPlaybackActive.value = true;
};

const handleTranslationPlaybackPause = () => {
  const hasNextSegment = activePlaybackIndex + 1 < activePlaybackSegments.length;
  if (hasNextSegment) return;
  isTranslationPlaybackPending.value = false;
  isTranslationPlaybackActive.value = false;
};

const handleTranslationPlaybackEnded = () => {
  isTranslationPlaybackPending.value = false;
  isTranslationPlaybackActive.value = false;
};

const handleTranslationPlaybackWaiting = () => {
  if (selectedResult.value?.videoUrl) {
    isTranslationPlaybackPending.value = true;
  }
};

const handleTranslationVideoLoaded = () => {
  const video = translationVideoRef.value;
  const item = selectedResult.value;
  if (!video || !item) return;

  if (activeTimeUpdateHandler) {
    video.removeEventListener('timeupdate', activeTimeUpdateHandler);
    activeTimeUpdateHandler = null;
  }

  const currentSegment = activePlaybackSegments[activePlaybackIndex] || item;
  const startSeconds = Math.max(0, (currentSegment.start || 0) / 1000);
  const endSeconds = Math.max(startSeconds, (currentSegment.end || 0) / 1000);
  video.playbackRate = TRANSLATION_PLAYBACK_RATE;
  video.currentTime = startSeconds;

  activeTimeUpdateHandler = () => {
    if (video.currentTime >= endSeconds) {
      video.pause();
      video.removeEventListener('timeupdate', activeTimeUpdateHandler);
      activeTimeUpdateHandler = null;

      const nextIndex = activePlaybackIndex + 1;
      const nextSegment = activePlaybackSegments[nextIndex];
      if (!nextSegment) {
        clearPreloadedSegment();
        isTranslationPlaybackPending.value = false;
        isTranslationPlaybackActive.value = false;
        return;
      }

      isTranslationPlaybackPending.value = true;

      activePlaybackIndex = nextIndex;
      translationStatusMessage.value = `구간 ${nextIndex + 1}/${activePlaybackSegments.length} 재생 중 (0.8x)`;

      const currentVideoUrl = getSegmentVideoUrl(currentSegment, item.videoUrl);
      const nextVideoUrl = getSegmentVideoUrl(nextSegment, item.videoUrl);

      if (nextVideoUrl === currentVideoUrl) {
        selectedResult.value = {
          ...selectedResult.value,
          start: nextSegment.start,
          end: nextSegment.end,
        };
        video.currentTime = Math.max(0, (nextSegment.start || 0) / 1000);
        preloadUpcomingSegment(activePlaybackSegments[nextIndex + 1], nextVideoUrl);
        handleTranslationVideoLoaded();
        return;
      }

      preloadUpcomingSegment(activePlaybackSegments[nextIndex + 1], nextVideoUrl);
      selectedResult.value = {
        ...selectedResult.value,
        videoUrl: nextVideoUrl,
        start: nextSegment.start,
        end: nextSegment.end,
      };
      selectedResultKey.value = `${selectedResultKey.value}-${nextIndex}`;
    }
  };

  video.addEventListener('timeupdate', activeTimeUpdateHandler);
  isTranslationPlaybackPending.value = true;
  video.play().catch(() => {
    isTranslationPlaybackPending.value = false;
    isTranslationPlaybackActive.value = false;
  });
};

const resetTranslationSearchState = ({ keepSuggestions = false } = {}) => {
  translationResults.value = [];
  annotateResults.value = [];
  parallelResults.value = [];
  if (!keepSuggestions) {
    translationSuggestions.value = [];
    showNoSuggestionMessage.value = false;
  }
  selectedResult.value = null;
  selectedResultKey.value = '';
};

const rejectBlockedInput = () => {
  resetTranslationSearchState();
  translationStatus.value = 'error';
  translationStatusMessage.value = '자기소개 금지';
};

const handleSuggestionSelect = async (item) => {
  if (!item?.text || isTranslationInputLocked.value) return;
  translationInput.value = item.text;
  showNoSuggestionMessage.value = false;
  await nextTick();
  await searchSignVideos();
};

const searchSignVideos = async () => {
  if (isTranslationInputLocked.value) return;

  const rawInput = translationInput.value.trim();
  if (!rawInput) {
    translationStatus.value = 'error';
    translationStatusMessage.value = '검색할 한글 문장을 먼저 입력해 주세요.';
    resetTranslationSearchState();
    return;
  }

  const localModeration = moderateInput(rawInput);
  if (localModeration.blocked) {
    rejectBlockedInput();
    return;
  }

  translationStatus.value = 'searching';
  translationStatusMessage.value = `수어 번역 영상을 찾는 중입니다.`;

  try {
    await axios.get(`${API_BASE_URL}/moderate`, {
      params: { text: rawInput },
    });
  } catch (error) {
    if (error?.response?.status === 400) {
      rejectBlockedInput();
      return;
    }
    translationStatus.value = 'error';
    translationStatusMessage.value = '입력 검증 중 문제가 발생했습니다.';
    return;
  }

  // 사용자가 입력한 원문은 UI에 그대로 유지하고, 검색 엔진 내부에서만 정규화합니다.
  const result = await searchCorpusByInput(rawInput);
  translationResults.value = result.matches;
  annotateResults.value = result.annotateMatches;
  parallelResults.value = result.parallelMatches;
  translationSuggestions.value = (result.suggestions || []).slice(0, 3);
  showNoSuggestionMessage.value = false;

  if (!result.matches.length) {
    resetTranslationSearchState({ keepSuggestions: true });
    translationStatus.value = 'error';
    translationStatusMessage.value = `수어 기준으로 연결 가능한 영상을 찾지 못했습니다. 추천 결과를 확인해 주세요.`;
    showNoSuggestionMessage.value = translationSuggestions.value.length === 0;
    translationHistory.value.unshift({
      query: rawInput,
      summary: translationSuggestions.value.length ? '유사문장 추천을 확인해 주세요.' : '유사 추천 문장이 없습니다.',
      topResult: null,
    });
    translationHistory.value = translationHistory.value.slice(0, 8);
    translationInput.value = '';
    return;
  }

  showNoSuggestionMessage.value = false;
  const summary = buildTranslationSummary(rawInput, result, result.matches[0]);
  translationHistory.value.unshift({
    query: rawInput,
    summary,
    topResult: result.matches[0],
  });
  translationHistory.value = translationHistory.value.slice(0, 8);
  await selectTranslationResult(result.matches[0]);
  translationStatusMessage.value = summary;
  translationInput.value = '';
};

const handleDownloadPageRequest = async (corpus) => {
  if (isLoading.value) return;

  isLoading.value = true;
  downloadPageUrl.value = '';
  downloadFiles.value = [];
  downloadFileCount.value = 0;
  activeCorpusType.value = corpus.type;
  activeCorpusLabel.value = corpus.label;
  statusMode.value = 'loading';
  statusMessage.value = `${corpus.label} 인증키로 국립국어원 오픈 API 메타데이터를 호출하고 있습니다.`;

  try {
    const response = await axios.get(`${API_BASE_URL}/files`, {
      params: {
        corpusType: corpus.type,
      },
    });

    const openUrl = typeof response.data?.downloadPageUrl === 'string'
      ? response.data.downloadPageUrl.trim()
      : '';

    if (response.status === 200 && openUrl.startsWith('http')) {
      downloadPageUrl.value = openUrl;
      downloadFiles.value = Array.isArray(response.data?.files) ? response.data.files : [];
      downloadFileCount.value = Number(response.data?.fileCount || downloadFiles.value.length || 0);
      statusMode.value = 'success';
      statusMessage.value = `${corpus.label} 메타데이터 호출이 정상 완료되었습니다. ${downloadFileCount.value}개 파일 목록을 확인한 뒤 국립국어원 다운로드 페이지를 열 수 있습니다.`;
      messages.value.push({ text: `${corpus.label} 메타데이터 호출에 성공했습니다. 파일 ${downloadFileCount.value}개를 확인했습니다.`, type: 'bot' });
    } else {
      statusMode.value = 'error';
      statusMessage.value = `${corpus.label} 호출에서 정상적인 메타데이터 응답 URL을 받지 못했습니다.`;
      messages.value.push({ text: `${corpus.label} 응답은 왔지만 메타데이터 확인용 URL 형식이 올바르지 않았습니다.`, type: 'bot' });
    }
  } catch (error) {
    const detail = error?.response?.data?.detail || error?.response?.data?.error || error?.message || '알 수 없는 오류';
    statusMode.value = 'error';
    statusMessage.value = `${corpus.label} API 호출에 실패했습니다. ${detail}`;
    messages.value.push({ text: `${corpus.label} 호출 실패: ${detail}`, type: 'bot' });
    console.error('API 호출 실패:', error);
  } finally {
    isLoading.value = false;
    nextTick(() => {
      if (chatBox.value) {
        chatBox.value.scrollTo({ top: chatBox.value.scrollHeight, behavior: 'smooth' });
      }
    });
  }
};
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at top left, rgba(78, 187, 172, 0.14), transparent 30%),
    radial-gradient(circle at bottom right, rgba(255, 170, 122, 0.18), transparent 32%),
    linear-gradient(180deg, #fffaf1 0%, #fff5e8 48%, #f7fbf7 100%);
  color: #264743;
  font-family: 'Inter', 'Noto Sans KR', 'Segoe UI', sans-serif;
}

:global(#app) {
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.app-shell {
  position: relative;
  min-height: 100vh;
  padding: 32px 20px;
  overflow: hidden;
}

.ambient {
  position: fixed;
  width: 420px;
  height: 420px;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.42;
  pointer-events: none;
}

.ambient-left {
  top: -120px;
  left: -160px;
  background: rgba(78, 187, 172, 0.26);
}

.ambient-right {
  right: -120px;
  bottom: -150px;
  background: rgba(255, 170, 122, 0.24);
}

.app-frame {
  position: relative;
  width: min(100%, 1280px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-page {
  gap: 18px;
  align-items: center;
}

.main-page > section {
  width: 100%;
}

.glass-card {
  border: 1px solid rgba(61, 124, 115, 0.12);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 48px rgba(50, 91, 85, 0.1);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.glass-subcard {
  border: 1px solid rgba(61, 124, 115, 0.1);
  background: rgba(255, 251, 246, 0.88);
  border-radius: 22px;
}

.hero-panel {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 6px;
  background: rgba(255, 245, 232, 0.96);
}

.hero-image {
  display: block;
  width: 100%;
  max-width: 900px;
  max-height: 360px;
  margin: 0 auto;
  height: auto;
  object-fit: contain;
  border-radius: 22px;
}

.page-header,
.viewer-card,
.translator-card,
.learn-hero,
.learn-card {
  position: relative;
  z-index: 1;
}

.main-hero-wrap {
  display: flex;
  justify-content: center;
  width: min(100%, 940px);
  margin: 0 auto;
  padding: 8px 10px;
  border-radius: 24px;
}

.hero-panel-soft {
  width: 100%;
  border: 1px solid rgba(52, 145, 132, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.main-slogan {
  width: min(100%, 940px);
  margin: 0 auto;
  padding: 16px 20px;
  border-radius: 22px;
  text-align: center;
  background: linear-gradient(135deg, rgba(78, 187, 172, 0.16), rgba(255, 170, 122, 0.18));
}

.main-slogan p {
  margin: 0;
  font-size: clamp(0.98rem, 2vw, 1.2rem);
  font-weight: 800;
  line-height: 1.65;
  color: #25504b;
  letter-spacing: -0.02em;
}

.mission-card {
  border-color: rgba(58, 143, 131, 0.16);
}

.main-purpose-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 16px;
  width: min(100%, 940px);
  margin: 0 auto;
}

.purpose-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 166px;
  padding: 22px 22px 20px;
  border-radius: 24px;
}

.purpose-card h3 {
  margin: 8px 0 10px;
  color: #1f413d;
  font-size: 1.08rem;
  line-height: 1.35;
}

.purpose-card p:last-child {
  margin: 0;
  color: #59726d;
  line-height: 1.6;
  font-size: 0.96rem;
}

.main-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: center;
  gap: 16px;
}

.main-actions-soft {
  width: min(100%, 760px);
  margin: 0 auto;
  padding-bottom: 6px;
}

.main-actions-row {
  align-items: stretch;
}

.main-action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 18px 20px;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  border-radius: 20px;
}

.compact-main-button {
  font-size: 1rem;
}

.translate-main-button {
  min-width: 0;
}

.section-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  color: rgba(62, 116, 108, 0.62);
}

.primary-button,
.secondary-button,
.text-button,
.icon-button,
.corpus-call-button,
.translation-result-card,
.suggestion-chip {
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.primary-button {
  padding: 16px 24px;
  border-radius: 18px;
  background: linear-gradient(135deg, #2aa99a, #ff9a64);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 16px 34px rgba(63, 153, 141, 0.24);
}

.secondary-button {
  padding: 16px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  color: #27524d;
  border: 1px solid rgba(60, 123, 114, 0.14);
}

.primary-button:hover,
.secondary-button:hover,
.text-button:hover,
.icon-button:hover,
.corpus-call-button:hover,
.translation-result-card:hover,
.suggestion-chip:hover {
  transform: translateY(-2px);
}

.learn-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.learn-card,
.learn-hero,
.viewer-card,
.translator-card,
.page-header {
  border-radius: 28px;
  padding: 24px;
}

.learn-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.learn-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(42, 169, 154, 0.12);
  font-size: 1.4rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.header-left {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.icon-button {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(42, 169, 154, 0.14);
  color: #23534d;
  border: 1px solid rgba(42, 169, 154, 0.18);
}

.icon-button svg {
  width: 24px;
  height: 24px;
}

.back-button {
  width: auto;
  min-width: 88px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 700;
  flex-shrink: 0;
}

.back-button span {
  font-size: 0.96rem;
}

.status-chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(36, 83, 77, 0.08);
  color: #325d57;
  border: 1px solid rgba(36, 83, 77, 0.08);
  font-weight: 700;
}

.status-chip.success {
  background: rgba(52, 211, 153, 0.16);
  color: #1e7f5c;
}

.status-chip.loading {
  background: rgba(96, 165, 250, 0.14);
  color: #255b9e;
}

.status-chip.error {
  background: rgba(248, 113, 113, 0.14);
  color: #b54a4a;
}

.sign-translate-header-left {
  align-items: center;
  gap: 18px;
}

.sign-translate-title-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  gap: 6px;
  min-width: 0;
}

.sign-translate-section-label {
  color: rgba(34, 108, 100, 0.72);
  letter-spacing: 0.16em;
  text-align: left;
}

.sign-translate-page-title {
  margin: 0;
  color: #23514c;
  font-size: 1.28rem;
  line-height: 1.45;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-wrap: balance;
  background: linear-gradient(135deg, #1f645d 0%, #2aa99a 52%, #ff9a64 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 22px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.text-button {
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(42, 169, 154, 0.1);
  color: #25514b;
  border: 1px solid rgba(42, 169, 154, 0.1);
}

.video-stage {
  min-height: 520px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(242,248,247,0.92)), #f7fbf7;
  border: 1px solid rgba(58, 124, 115, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-video {
  width: 100%;
  min-height: 520px;
  background: #000;
  object-fit: contain;
}

.translation-player-wrap,
.download-result,
.video-placeholder {
  width: 100%;
  min-height: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 32px;
}

.placeholder-icon {
  display: block;
  font-size: 3rem;
  line-height: 1;
  margin: 0;
}

.video-placeholder strong {
  display: block;
  margin: 0;
  line-height: 1.45;
}

.video-placeholder p,
.helper-text,
.learn-card p,
.learn-hero p,
.download-result p,
.empty-result-box p {
  color: #5b716d;
  line-height: 1.7;
}

.video-placeholder p.blocked-message {
  color: #d93025;
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.download-panel,
.upload-panel {
  padding: 18px;
  margin-bottom: 18px;
}

.upload-header h3 {
  margin: 8px 0 6px;
}

.corpus-button-list,
.translation-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.translation-chat-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 14px;
}

.translation-chat-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.translation-user-bubble,
.translation-bot-bubble {
  max-width: 92%;
  padding: 14px 16px;
  border-radius: 18px;
  line-height: 1.6;
}

.translation-user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.88), rgba(34, 211, 238, 0.88));
  color: #fff;
}

.translation-bot-bubble {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(61, 124, 115, 0.1);
  color: #2d4945;
}

.translation-bot-bubble span {
  display: block;
  margin-top: 8px;
  color: #70827e;
}

.suggestion-wrap {
  margin-top: 14px;
}

.suggestion-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.suggestion-chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(61, 124, 115, 0.1);
  color: #2d4945;
}

.corpus-button-list,
.corpus-call-button {
  width: 100%;
}

.corpus-call-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 240px;
  max-height: 360px;
  overflow-y: auto;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.bot-avatar {
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(34, 211, 238, 0.9));
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 82%;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  color: #2d4945;
  line-height: 1.6;
}

.learn-hero h3,
.learn-card h3,
.card-header h3,
.page-header h2 {
  margin: 8px 0 8px;
}

.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.screen-fade-enter-from,
.screen-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.download-actions {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.multi-actions {
  gap: 12px;
  flex-wrap: wrap;
}

.download-link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.analysis-grid-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.analysis-card,
.translation-result-card,
.empty-result-box,
.selected-meta-grid > div {
  border-radius: 18px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(61, 124, 115, 0.1);
}

.analysis-card strong,
.translation-result-card strong,
.selected-meta-grid strong {
  display: block;
  margin-top: 8px;
  color: #274440;
  line-height: 1.5;
}

.analysis-card span,
.analysis-card small,
.translation-result-card span,
.translation-result-card small {
  display: block;
  margin-top: 6px;
  color: #667a76;
  line-height: 1.5;
}

.translation-input-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  margin-top: 16px;
  align-items: stretch;
}

.translation-input-field-wrap {
  min-width: 0;
}

.translation-input {
  width: 100%;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(61, 124, 115, 0.14);
  background: rgba(255, 255, 255, 0.9);
  color: #223f3b;
  padding: 0 18px;
  outline: none;
}

.translation-input::placeholder {
  color: #8ca09c;
}

.translate-search-button {
  min-width: 108px;
  white-space: nowrap;
}

.analysis-label {
  margin: 0;
  font-size: 0.85rem;
  color: #6d827d;
}

.sign-translate-clean-page {
  gap: 20px;
}

.sign-translate-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: 20px;
}

.sign-player-card,
.sign-chat-card {
  border-radius: 30px;
}

.sign-player-card {
  padding: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.clean-video-stage {
  min-height: 620px;
  border-radius: 28px;
  background: radial-gradient(circle at top, rgba(42, 169, 154, 0.12), transparent 30%), #f7fbf9;
}

.preload-video {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.clean-video-placeholder {
  padding: 40px;
  gap: 12px;
}

.sign-chat-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.82);
}

.sign-chat-header {
  padding-bottom: 4px;
}

.sign-chat-header h3 {
  margin: 8px 0 8px;
}

.clean-chat-log {
  min-height: 420px;
  max-height: 560px;
  padding: 10px 6px 10px 0;
  border-radius: 24px;
  background: rgba(248, 252, 251, 0.92);
  border: 1px solid rgba(61, 124, 115, 0.08);
}

.translation-chat-entry {
  padding: 0 14px;
}

.translation-user-bubble,
.translation-bot-bubble {
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08);
}

.translation-user-bubble {
  border-bottom-right-radius: 8px;
}

.translation-bot-bubble {
  border-bottom-left-radius: 8px;
}

.empty-chat-state {
  min-height: 320px;
  border-radius: 24px;
  border: 1px dashed rgba(61, 124, 115, 0.16);
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 28px;
  color: #5d726e;
}

.clean-suggestion-wrap {
  margin-top: 0;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(248, 252, 251, 0.92);
  border: 1px solid rgba(61, 124, 115, 0.08);
}

.empty-suggestion-wrap {
  text-align: left;
}

.empty-suggestion-message {
  margin: 8px 0 0;
  color: #6b7d79;
  font-size: 0.95rem;
  line-height: 1.5;
}

.clean-input-wrap {
  margin-top: auto;
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(61, 124, 115, 0.14);
  position: sticky;
  bottom: 0;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 18px 36px rgba(38, 71, 67, 0.08);
}

.clean-input-wrap .translation-input {
  min-height: 60px;
  border-radius: 20px;
  background: #ffffff;
  border: 2px solid rgba(79, 179, 165, 0.42);
  box-shadow: 0 0 0 6px rgba(79, 179, 165, 0.12), 0 12px 26px rgba(79, 179, 165, 0.12);
}

.clean-input-wrap .translation-input:focus {
  border-color: rgba(79, 179, 165, 0.86);
  box-shadow: 0 0 0 7px rgba(79, 179, 165, 0.18), 0 14px 30px rgba(79, 179, 165, 0.16);
}

.clean-input-wrap .translate-search-button {
  min-height: 60px;
  border-radius: 20px;
  padding: 0 24px;
}

.download-file-preview {
  width: 100%;
  max-width: 620px;
  margin-top: 22px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(61, 124, 115, 0.1);
  text-align: left;
}

.download-file-preview-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #2d4945;
}

.download-file-list {
  margin: 0;
  padding-left: 18px;
  color: #5b716d;
  display: grid;
  gap: 8px;
}

@media (max-width: 1024px) {
  .content-grid,
  .analysis-grid-triple,
  .sign-translate-layout,
  .main-purpose-grid {
    grid-template-columns: 1fr;
  }

  .main-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-chip {
    align-self: flex-start;
  }

  .clean-video-stage {
    min-height: 440px;
  }

  .video-stage,
  .download-result,
  .video-placeholder,
  .translation-player-wrap,
  .sign-video {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .app-shell {
    padding: 20px 14px 28px;
  }

  .app-frame {
    gap: 18px;
  }

  .page-header,
  .viewer-card,
  .translator-card,
  .learn-hero,
  .learn-card {
    padding: 20px;
    border-radius: 24px;
  }

  .learn-grid,
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .hero-image {
    max-height: 220px;
    border-radius: 18px;
  }

  .main-hero-wrap {
    width: 100%;
    padding: 8px;
  }

  .main-slogan {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .main-actions {
    grid-template-columns: 1fr;
  }

  .translation-input-wrap {
    grid-template-columns: 1fr;
  }

  .page-header {
    position: sticky;
    top: 10px;
    z-index: 10;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
    align-items: flex-start;
  }

  .back-button {
    min-width: 80px;
    height: 44px;
    border-radius: 14px;
  }

  .page-header h2 {
    font-size: 1.02rem;
    line-height: 1.5;
    word-break: keep-all;
  }

  .sign-translate-header-left {
    align-items: flex-start;
    gap: 12px;
  }

  .sign-translate-page-title {
    font-size: 1.02rem;
    line-height: 1.55;
  }

  .clean-chat-log {
    min-height: 320px;
    max-height: none;
  }

  .main-action-button,
  .corpus-call-button,
  .translate-search-button {
    width: 100%;
  }

  .translation-user-bubble,
  .translation-bot-bubble,
  .message-bubble {
    max-width: 100%;
  }

  .video-stage,
  .download-result,
  .video-placeholder,
  .translation-player-wrap,
  .sign-video,
  .clean-video-stage {
    min-height: 280px;
  }
}

@media (max-width: 480px) {
  .app-shell {
    padding: 14px 10px 24px;
  }

  .main-hero-wrap,
  .main-slogan,
  .purpose-card,
  .page-header,
  .viewer-card,
  .translator-card,
  .learn-card,
  .learn-hero {
    border-radius: 20px;
  }

  .main-action-button,
  .primary-button,
  .secondary-button,
  .corpus-call-button {
    min-height: 52px;
    padding: 12px 14px;
    font-size: 0.95rem;
  }

  .translation-input,
  .clean-input-wrap .translate-search-button {
    min-height: 52px;
  }
}
</style>
