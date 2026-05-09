import { expect, test } from '@playwright/test';

test('student can draw, switch axes, and clear the studio', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: '마법의 데칼코마니: 대칭 아트 스튜디오' }),
  ).toBeVisible();
  const canvas = page.getByLabel('대칭 그림 캔버스');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Canvas bounding box was not available');
  }

  const dispatchPointer = async (
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    x: number,
    y: number,
    buttons: number,
    pointerType: 'pen' | 'mouse' = 'pen',
  ) => {
    await canvas.dispatchEvent(type, {
      pointerId: 1,
      pointerType,
      isPrimary: true,
      clientX: x,
      clientY: y,
      buttons,
      bubbles: true,
      cancelable: true,
    });
  };

  const clickCanvasFraction = async (xFraction: number, yFraction: number) => {
    const currentBox = await canvas.boundingBox();
    expect(currentBox).not.toBeNull();
    if (!currentBox) {
      throw new Error('Canvas bounding box was not available');
    }

    const x = currentBox.x + currentBox.width * xFraction;
    const y = currentBox.y + currentBox.height * yFraction;
    await dispatchPointer('pointerdown', x, y, 1, 'mouse');
    await dispatchPointer('pointerup', x, y, 0, 'mouse');
    return { xFraction, yFraction };
  };

  const startX = box.x + box.width * 0.25;
  const startY = box.y + box.height * 0.4;
  const midX = box.x + box.width * 0.32;
  const midY = box.y + box.height * 0.48;
  const endX = box.x + box.width * 0.38;
  const endY = box.y + box.height * 0.37;

  await dispatchPointer('pointerdown', startX, startY, 1);
  await dispatchPointer('pointermove', midX, midY, 1);
  await dispatchPointer('pointermove', endX, endY, 1);
  await dispatchPointer('pointerup', endX, endY, 0);

  const isPaintedPoint = async (xFraction: number, yFraction: number) =>
    canvas.evaluate(
      (element, { xFraction, yFraction }) => {
        const background = { r: 255, g: 253, b: 248 };
        const canvas = element as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) {
          return false;
        }

        const x = Math.round(canvas.width * xFraction);
        const y = Math.round(canvas.height * yFraction);
        const offsets: number[] = [];
        for (let delta = -6; delta <= 6; delta += 1) {
          offsets.push(delta);
        }

        for (const dy of offsets) {
          for (const dx of offsets) {
            const px = x + dx;
            const py = y + dy;
            if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
              continue;
            }

            const pixel = context.getImageData(px, py, 1, 1).data;
            if (
              pixel[3] > 0 &&
              (pixel[0] !== background.r ||
                pixel[1] !== background.g ||
                pixel[2] !== background.b)
            ) {
              return true;
            }
          }
        }

        return false;
      },
      { xFraction, yFraction },
    );

  const isPainted = await isPaintedPoint(0.25, 0.4);
  const reflectedIsPainted = await isPaintedPoint(0.75, 0.4);

  expect(isPainted).toBe(true);
  expect(reflectedIsPainted).toBe(true);

  await expect(page.getByRole('status')).toContainText('획을 완성했습니다');

  await page.getByRole('radio', { name: '대각선 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('대각선 대칭축');

  await page.getByRole('radio', { name: '세로 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('세로 대칭축');

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('한 번 더 누르면 캔버스를 비웁니다');

  await page.getByRole('button', { name: '전체 지우기 확인' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');

  await page.getByRole('button', { name: '격자 보기' }).click();
  await page.getByRole('button', { name: '점 탐구' }).click();

  await expect(page.getByRole('button', { name: '점 탐구' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '거리 힌트' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  const firstPoint = await clickCanvasFraction(0.22, 0.5);
  const reflectedXFraction = 1 - firstPoint.xFraction;
  const noHintGuideXFraction = (firstPoint.xFraction + 0.5) / 2;

  expect(await isPaintedPoint(firstPoint.xFraction, firstPoint.yFraction)).toBe(true);
  expect(await isPaintedPoint(reflectedXFraction, firstPoint.yFraction)).toBe(true);
  expect(await isPaintedPoint(noHintGuideXFraction, firstPoint.yFraction)).toBe(false);

  await page.getByRole('button', { name: '거리 힌트' }).click();
  await expect(page.getByRole('button', { name: '거리 힌트' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toContainText(
    '거리 힌트를 켰습니다. 점 탐구 모드일 때 가이드가 보여집니다.',
  );

  const secondPoint = await clickCanvasFraction(0.26, 0.64);
  await expect(page.getByRole('status')).toContainText(
    '원본점과 대칭점은 대칭축에서 같은 거리에 있습니다.',
  );
  await expect(page.locator('[aria-label="수업 관찰 질문"]')).toContainText(
    '원본점과 대칭점은 대칭축에서 같은 거리에 있습니다.',
  );

  const guideXFraction = (secondPoint.xFraction + 0.5) / 2;
  expect(await isPaintedPoint(guideXFraction, secondPoint.yFraction)).toBe(true);

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('한 번 더 누르면 캔버스를 비웁니다');
  await page.getByRole('button', { name: '전체 지우기 확인' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');
  expect(await isPaintedPoint(firstPoint.xFraction, firstPoint.yFraction)).toBe(false);
});
