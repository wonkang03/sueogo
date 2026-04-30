import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { URL } from 'node:url';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from 'webdav';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const PORT = Number(process.env.PORT || 8788);
const HOST = process.env.HOST || '0.0.0.0';
const KLI_DOWNLOAD_URL = 'https://kli.korean.go.kr/restapi/v1/corpus/download';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');
const DIST_ROOT = path.join(PROJECT_ROOT, 'dist');
const INDEX_PATH = path.join(SRC_ROOT, 'generated', 'corpusIndex.generated.json');
const DIST_INDEX_PATH = path.join(DIST_ROOT, 'index.html');
const DEFAULT_NAS_VIDEO_BASE_PATH = '/';

const CORPUS_KEYS = {
  raw: { label: 'raw-corpus', key: process.env.KLI_API_KEY_RAW || 'cKdKsyicESJPWSqXDCKcBvmrpyHlZyWz' },
  annotated: { label: 'annotated-corpus', key: process.env.KLI_API_KEY_ANNOTATED || 'TMtdXOvMwSrSnZNwHoVCHUiPPmpwQnXz' },
  parallel: { label: 'parallel-corpus', key: process.env.KLI_API_KEY_PARALLEL || 'HujeosvaSwljptcqnKjKiVAPEpkfoNPK' },
  raw2024: { label: 'raw-corpus-2024', key: process.env.KLI_API_KEY_RAW_2024 || 'tTeSFEwvGicNwXrQTHKJUvHOQjsMgRmP' },
  annotated2024: { label: 'annotated-corpus-2024', key: process.env.KLI_API_KEY_ANNOTATED_2024 || 'lEYkppYshsRpWAqMyEEgPhDqMIsxizGR' },
  parallelKoKsl2022: { label: 'parallel-ko-ksl-2022', key: process.env.KLI_API_KEY_PARALLEL_KO_KSL_2022 || 'cresPedbeGxPsnVjGdsNYiOMuusEMEJg' },
  parallelKoKsl2023: { label: 'parallel-ko-ksl-2023', key: process.env.KLI_API_KEY_PARALLEL_KO_KSL_2023 || 'bdaSZQLXOpCCIkrCLdjcZtRVLzZGTpYg' },
  parallelKoKsl2024: { label: 'parallel-ko-ksl-2024', key: process.env.KLI_API_KEY_PARALLEL_KO_KSL_2024 || 'TtZZOHXtSSWNVBfPJJSgGaaHTJdgPuOw' },
  parallelKslKo2024: { label: 'parallel-ksl-ko-2024', key: process.env.KLI_API_KEY_PARALLEL_KSL_KO_2024 || 'NTkwZHOggEHdQcfbSeyKFsHVFmgxrcZj' },
};

function parseBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.json') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  });
  res.end(text);
}

function resolveDistPath(requestPath = '/') {
  const sanitized = requestPath === '/' ? '/index.html' : requestPath;
  const relative = sanitized.replace(/^\//, '');
  const absPath = path.resolve(DIST_ROOT, relative);
  if (!absPath.startsWith(DIST_ROOT)) return '';
  return absPath;
}

function streamLocalFile(req, res, filePath) {
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  const contentType = getContentType(filePath);

  if (range) {
    const { safeStart, safeEnd } = parseRangeHeader(range, stat.size);
    if (safeStart == null || safeEnd == null) {
      res.writeHead(416, {
        'Content-Range': `bytes */${stat.size}`,
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      });
      res.end();
      return;
    }

    res.writeHead(206, {
      'Content-Type': contentType,
      'Content-Length': safeEnd - safeStart + 1,
      'Content-Range': `bytes ${safeStart}-${safeEnd}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    });
    fs.createReadStream(filePath, { start: safeStart, end: safeEnd }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  });
  fs.createReadStream(filePath).pipe(res);
}

function parseRangeHeader(rangeHeader, fileSize) {
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader || '');
  if (!match) return { safeStart: null, safeEnd: null };

  const startRaw = match[1];
  const endRaw = match[2];

  let start;
  let end;

  if (startRaw === '' && endRaw === '') return { safeStart: null, safeEnd: null };

  if (startRaw === '') {
    const suffixLength = Number(endRaw);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return { safeStart: null, safeEnd: null };
    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    start = Number(startRaw);
    end = endRaw === '' ? fileSize - 1 : Number(endRaw);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return { safeStart: null, safeEnd: null };
  if (start < 0 || start >= fileSize || end < start) return { safeStart: null, safeEnd: null };

  return {
    safeStart: start,
    safeEnd: Math.min(end, fileSize - 1),
  };
}

const nasHttpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: !parseBoolean(process.env.NAS_ALLOW_SELF_SIGNED, false),
});

let webDavClient = null;

function getNasConfig() {
  return {
    url: (process.env.NAS_URL || '').trim(),
    username: (process.env.NAS_USER || '').trim(),
    password: process.env.NAS_PASS || '',
    basePath: (process.env.NAS_VIDEO_BASE_PATH || DEFAULT_NAS_VIDEO_BASE_PATH).trim() || DEFAULT_NAS_VIDEO_BASE_PATH,
  };
}

function assertNasConfig() {
  const config = getNasConfig();
  if (!config.url || !config.username || !config.password) {
    const error = new Error('NAS WebDAV 환경 변수가 설정되지 않았습니다.');
    error.statusCode = 500;
    throw error;
  }
  return config;
}

function getWebDavClient() {
  if (webDavClient) return webDavClient;

  const config = assertNasConfig();
  webDavClient = createClient(config.url, {
    username: config.username,
    password: config.password,
    httpsAgent: nasHttpsAgent,
  });
  return webDavClient;
}

const NAS_DATASET_ALIASES = {
  annotate: 'annotate',
  annotate_2024: 'annotate_2024',
  farsightness: 'farsightness',
  farsightness_2024: 'farsightness_2024',
  parallel_ko_2022: 'parallel_ko_2022',
  parallel_ko_2023: 'parallel_ko_2023',
  parallel_ko_2024: 'parallel_ko_2024',
};

function mapAssetSegmentsToNas(segments = []) {
  if (!segments.length) return [];

  const filtered = segments.filter(Boolean);
  const withoutAssets = filtered[0] === 'assets' ? filtered.slice(1) : filtered;
  if (!withoutAssets.length) return [];

  const datasetKey = withoutAssets[0];
  const mappedDataset = NAS_DATASET_ALIASES[datasetKey] || datasetKey;
  return [mappedDataset, ...withoutAssets.slice(1)];
}

function resolveNasAssetPath(assetKey = '') {
  const cleaned = String(assetKey || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
  if (!cleaned) return '';

  const segments = cleaned.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) return '';

  const mappedSegments = mapAssetSegmentsToNas(segments);
  if (!mappedSegments.length) return '';

  const { basePath } = getNasConfig();
  const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const remotePath = path.posix.join(normalizedBase, ...mappedSegments);
  return remotePath.startsWith('/') ? remotePath : `/${remotePath}`;
}

async function resolveExistingNasFile(client, remotePath) {
  if (!remotePath) return '';
  if (await client.exists(remotePath)) return remotePath;

  const normalized = remotePath.replace(/\\/g, '/');
  const parsed = path.posix.parse(normalized);
  const folderName = path.posix.basename(parsed.dir);
  const datasetName = normalized.split('/').filter(Boolean).slice(-3, -2)[0] || '';
  const isCorpusFolderVideo = parsed.name === folderName && ['annotate', 'annotate_2024', 'farsightness', 'farsightness_2024'].includes(datasetName);
  if (!isCorpusFolderVideo) return '';

  try {
    const entries = await client.getDirectoryContents(parsed.dir, { deep: false });
    const mp4Candidates = entries
      .filter((entry) => entry.type === 'file' && String(entry.basename || '').toLowerCase().endsWith('.mp4'))
      .sort((a, b) => String(a.basename || '').localeCompare(String(b.basename || '')));
    return mp4Candidates[0]?.filename || '';
  } catch {
    return '';
  }
}

function handleWebDavError(error, res) {
  const statusCode = error?.status || error?.statusCode || error?.response?.status || 502;

  if (statusCode === 404) {
    sendJson(res, 404, { error: 'NAS에서 요청한 영상 파일을 찾을 수 없습니다.' });
    return;
  }

  if (statusCode === 401 || statusCode === 403) {
    sendJson(res, 502, { error: 'NAS WebDAV 인증에 실패했습니다. .env 설정을 확인해 주세요.' });
    return;
  }

  sendJson(res, 502, {
    error: 'NAS WebDAV 연결 또는 스트리밍에 실패했습니다.',
    detail: error?.message || 'Unknown WebDAV error',
  });
}

async function streamNasFile(req, res, remotePath) {
  try {
    const client = getWebDavClient();
    const resolvedRemotePath = await resolveExistingNasFile(client, remotePath);
    if (!resolvedRemotePath) {
      sendJson(res, 404, { error: 'NAS에서 요청한 영상 파일을 찾을 수 없습니다.' });
      return;
    }

    const stat = await client.stat(resolvedRemotePath);
    const fileSize = Number(stat?.size || 0);
    const contentType = stat?.mime || getContentType(resolvedRemotePath);
    const rangeHeader = req.headers.range;
    const baseHeaders = {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Cache-Control': 'private, max-age=60',
    };

    let streamOptions = {};

    if (rangeHeader && fileSize > 0) {
      const { safeStart, safeEnd } = parseRangeHeader(rangeHeader, fileSize);
      if (safeStart == null || safeEnd == null) {
        res.writeHead(416, {
          ...baseHeaders,
          'Content-Range': `bytes */${fileSize}`,
        });
        res.end();
        return;
      }

      streamOptions = { range: { start: safeStart, end: safeEnd } };
      res.writeHead(206, {
        ...baseHeaders,
        'Content-Length': safeEnd - safeStart + 1,
        'Content-Range': `bytes ${safeStart}-${safeEnd}/${fileSize}`,
      });
    } else {
      if (fileSize > 0) baseHeaders['Content-Length'] = fileSize;
      res.writeHead(200, baseHeaders);
    }

    const remoteStream = client.createReadStream(resolvedRemotePath, streamOptions);
    remoteStream.on('error', (error) => {
      if (!res.headersSent) {
        handleWebDavError(error, res);
        return;
      }
      res.destroy(error);
    });
    req.on('close', () => remoteStream.destroy());
    remoteStream.pipe(res);
  } catch (error) {
    handleWebDavError(error, res);
  }
}

async function fetchCorpusMetadata(corpusType) {
  const corpus = CORPUS_KEYS[corpusType];

  if (!corpus) return { ok: false, status: 400, payload: { error: '지원하지 않는 코퍼스 유형입니다.' } };
  if (!corpus.key) return { ok: false, status: 500, payload: { error: `${corpus.label} 인증키가 설정되지 않았습니다.` } };

  try {
    const response = await axios.get(KLI_DOWNLOAD_URL, {
      params: { keyVal: corpus.key },
      responseType: 'text',
      transformResponse: [(data) => data],
    });

    const raw = typeof response.data === 'string' ? response.data.trim() : '';
    const downloadPageUrl = raw.startsWith('http') ? raw : '';
    if (!downloadPageUrl) {
      return { ok: false, status: 404, payload: { error: '다운로드 페이지 링크를 찾지 못했습니다.', raw, corpusType, label: corpus.label } };
    }

    const htmlResponse = await axios.get(downloadPageUrl, {
      responseType: 'text',
      transformResponse: [(data) => data],
    });

    const html = typeof htmlResponse.data === 'string' ? htmlResponse.data : '';
    const match = html.match(/JSON\.parse\('([\s\S]*?)'\);/);
    const parsedData = match ? JSON.parse(match[1]) : null;
    const files = Array.isArray(parsedData?.downloadList)
      ? parsedData.downloadList.map((item, index) => ({ id: `${corpusType}-${index + 1}`, fileName: item.printFileName, fileSize: item.fileSize || null }))
      : [];

    return {
      ok: true,
      status: 200,
      payload: { corpusType, label: corpus.label, downloadPageUrl, fileCount: parsedData?.fileCnt || files.length, files, downloadMeta: parsedData },
    };
  } catch (error) {
    const status = error?.response?.status || 500;
    const detail = typeof error?.response?.data === 'string' ? error.response.data.slice(0, 500) : error?.message || 'KLI API 호출에 실패했습니다.';
    return { ok: false, status, payload: { error: 'KLI API 호출에 실패했습니다.', detail, corpusType, label: corpus.label } };
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: '잘못된 요청입니다.' });

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  if (req.method === 'GET' && url.pathname === '/api/sign-video/index') {
    if (!fs.existsSync(INDEX_PATH)) return sendJson(res, 404, { error: '인덱스 파일이 없습니다.' });
    streamLocalFile(req, res, INDEX_PATH);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/sign-video/asset') {
    const assetKey = url.searchParams.get('path') || '';
    const remotePath = resolveNasAssetPath(assetKey);
    if (!remotePath) {
      sendJson(res, 400, { error: '허용되지 않은 영상 경로입니다.' });
      return;
    }
    await streamNasFile(req, res, remotePath);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/sign-video') {
    const corpusType = (url.searchParams.get('corpusType') || 'raw').trim();
    const result = await fetchCorpusMetadata(corpusType);
    sendJson(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/sign-video/files') {
    const corpusType = (url.searchParams.get('corpusType') || 'raw').trim();
    const result = await fetchCorpusMetadata(corpusType);
    sendJson(res, result.status, result.payload);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/sign-video/test-all') {
    const entries = Object.keys(CORPUS_KEYS);
    const results = [];
    for (const corpusType of entries) {
      const result = await fetchCorpusMetadata(corpusType);
      results.push({ corpusType, ok: result.ok, status: result.status, ...result.payload });
    }
    sendJson(res, 200, { results });
    return;
  }

  if (req.method === 'GET') {
    const distPath = resolveDistPath(url.pathname);
    if (distPath && fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
      streamLocalFile(req, res, distPath);
      return;
    }
    if (fs.existsSync(DIST_INDEX_PATH)) {
      streamLocalFile(req, res, DIST_INDEX_PATH);
      return;
    }
  }

  sendText(res, 404, '요청한 경로를 찾을 수 없습니다.');
});

server.listen(PORT, HOST, () => {
  console.log(`KLI proxy server listening on http://${HOST}:${PORT}`);
});
