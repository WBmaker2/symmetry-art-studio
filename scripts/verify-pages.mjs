import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';

const execFileAsync = promisify(execFile);

const DEFAULT_PAGE_URL = 'https://wbmaker2.github.io/symmetry-art-studio/';
const DEFAULT_EXPECTED_INDEX = 'dist/index.html';

const args = process.argv.slice(2);
let pageUrlInput = DEFAULT_PAGE_URL;
let expectedIndexPath = DEFAULT_EXPECTED_INDEX;
let positionalCount = 0;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (!arg.startsWith('--')) {
    positionalCount += 1;
    if (positionalCount === 1) {
      pageUrlInput = arg;
    }
    continue;
  }

  if (arg === '--expected-index') {
    expectedIndexPath = args[index + 1] ?? DEFAULT_EXPECTED_INDEX;
    index += 1;
    continue;
  }

  if (arg.startsWith('--expected-index=')) {
    expectedIndexPath = arg.replace('--expected-index=', '');
    continue;
  }

  throw new Error(`Unknown option: ${arg}`);
}

function parsePageUrl(input) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Only http and https URLs are allowed, got ${url.protocol} for ${input}`);
  }
  return url;
}

async function fetchWithCurlFallback(url, { outputToDevNull = false } = {}) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetch response ${response.status}`);
    }

    return outputToDevNull ? null : response.text();
  } catch (fetchError) {
    try {
      const options = ['-sS', '-L', '--fail', '--'];
      const commandArgs = outputToDevNull
        ? [...options, '--output', '/dev/null', url.toString()]
        : [...options, url.toString()];

      const result = await execFileAsync('curl', commandArgs, {
        encoding: 'utf8',
      });

      return outputToDevNull ? null : result.stdout;
    } catch (curlError) {
      throw new Error(
        `Both fetch and curl failed for ${url}. fetch: ${fetchError.message}; curl: ${curlError.message}`,
      );
    }
  }
}

async function fetchTextWithRetry(url, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithCurlFallback(url);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await sleep(300 * attempt);
    }
  }

  throw new Error(
    `Unable to fetch page after ${retries} retries. ${lastError?.message ?? 'Unknown error'}`,
  );
}

async function ensureAsset(url, retries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await fetchWithCurlFallback(url, { outputToDevNull: true });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      await sleep(300 * attempt);
    }
  }

  throw new Error(`${lastError?.message ?? 'Unknown error'} after ${retries} retries`);
}

function extractAssetRefs(html) {
  const refs = new Set();

  for (const match of html.matchAll(/(?:src|href)=("|')([^"']+\.(?:js|css)(?:\?[^"']*)?)\1/g)) {
    const href = match[2];
    refs.add(href);
  }

  return refs;
}

function normalizeAssetPath(rawRef, pageUrl) {
  if (!rawRef || rawRef.startsWith('data:') || rawRef.startsWith('mailto:')) {
    return null;
  }

  const normalized = new URL(rawRef, pageUrl);

  if (!['http:', 'https:'].includes(normalized.protocol)) {
    return null;
  }

  return `${normalized.pathname}${normalized.search}`;
}

const pageUrl = parsePageUrl(pageUrlInput);
const expectedIndex = await fs.readFile(expectedIndexPath, 'utf8').catch(() => {
  throw new Error(`Unable to read expected index file: ${expectedIndexPath}`);
});

const pageHtml = await fetchTextWithRetry(pageUrl);

if (!pageHtml.includes('마법의 데칼코마니: 대칭 아트 스튜디오')) {
  throw new Error('Live HTML did not contain the app title.');
}

const expectedAssets = new Set();
for (const rawAssetRef of extractAssetRefs(expectedIndex)) {
  const normalized = normalizeAssetPath(rawAssetRef, pageUrl);
  if (normalized) {
    expectedAssets.add(normalized);
  }
}

if (expectedAssets.size === 0) {
  throw new Error('Expected index did not reference JS/CSS assets.');
}

const remoteAssetPaths = new Set();
for (const rawAssetRef of extractAssetRefs(pageHtml)) {
  const normalized = normalizeAssetPath(rawAssetRef, pageUrl);
  if (normalized) {
    remoteAssetPaths.add(normalized);
  }
}

for (const expectedAsset of expectedAssets) {
  if (!remoteAssetPaths.has(expectedAsset)) {
    throw new Error(`Expected asset path ${expectedAsset} from local build is missing in live HTML.`);
  }

  await ensureAsset(new URL(expectedAsset, pageUrl), 3);
}

console.log(`Verified ${pageUrl} with ${expectedAssets.size} assets from ${expectedIndexPath}.`);
