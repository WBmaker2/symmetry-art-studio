const pageUrl = process.argv[2] ?? 'https://wbmaker2.github.io/symmetry-art-studio/';

const response = await fetch(pageUrl);
if (!response.ok) {
  throw new Error(`Expected ${pageUrl} to return 200, got ${response.status}`);
}

const html = await response.text();
if (!html.includes('마법의 데칼코마니: 대칭 아트 스튜디오')) {
  throw new Error('Live HTML did not contain the app title.');
}

const assetMatches = new Set(
  [...html.matchAll(/(?:src|href)="([^"\']+\.(?:js|css)(?:[^"\']*)?)"/g)].map((match) => match[1]),
);

if (assetMatches.size === 0) {
  throw new Error('Live HTML did not reference JS/CSS assets.');
}

for (const assetPath of assetMatches) {
  const assetUrl = new URL(assetPath, pageUrl).toString();
  const assetResponse = await fetch(assetUrl);
  if (!assetResponse.ok) {
    throw new Error(
      `Expected asset ${assetUrl} to return 200, got ${assetResponse.status}`,
    );
  }
}

console.log(`Verified ${pageUrl} with ${assetMatches.size} assets.`);
