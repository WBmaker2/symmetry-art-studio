import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const execFileAsync = promisify(execFile);

const pageUrl = process.argv[2] ?? 'https://wbmaker2.github.io/symmetry-art-studio/';

async function fetchWithCurlFallback(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetch response ${response.status}`);
    }

    return await response.text();
  } catch (fetchError) {
    try {
      const { stdout } = await execFileAsync('curl', ['-sS', '-L', '--fail', url], {
        encoding: 'utf8',
      });
      return stdout;
    } catch (curlError) {
      throw new Error(
        `Both fetch and curl failed for ${url}. fetch: ${fetchError.message}; curl: ${curlError.message}`,
      );
    }
  }
}

async function ensureAsset(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetch response ${response.status}`);
    }
    return;
  } catch (fetchError) {
    try {
      await execFileAsync('curl', ['-sS', '-L', '--fail', '--output', '/dev/null', url]);
      return;
    } catch (curlError) {
      throw new Error(
        `Both fetch and curl failed for ${url}. fetch: ${fetchError.message}; curl: ${curlError.message}`,
      );
    }
  }
}

const html = await fetchWithCurlFallback(pageUrl);
if (!html.includes('마법의 데칼코마니: 대칭 아트 스튜디오')) {
  throw new Error('Live HTML did not contain the app title.');
}

const assetMatches = new Set(
  [...html.matchAll(/(?:src|href)="([^"']+\.(?:js|css)(?:[^"']*)?)"/g)].map((match) => match[1]),
);

if (assetMatches.size === 0) {
  throw new Error('Live HTML did not reference JS/CSS assets.');
}

for (const assetPath of assetMatches) {
  const assetUrl = new URL(assetPath, pageUrl).toString();
  await ensureAsset(assetUrl);
}

console.log(`Verified ${pageUrl} with ${assetMatches.size} assets.`);
