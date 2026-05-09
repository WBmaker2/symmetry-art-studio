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

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('한 번 더 누르면 캔버스를 비웁니다');

  await page.getByRole('button', { name: '전체 지우기 확인' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');

  await page.getByRole('button', { name: '격자 보기' }).click();
  await page.getByRole('button', { name: '거리 힌트' }).click();
  await page.getByRole('button', { name: '점 탐구' }).click();

  await expect(page.getByRole('button', { name: '점 탐구' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const pointX = box.x + box.width * 0.22;
  const pointY = box.y + box.height * 0.5;
  await dispatchPointer('pointerdown', pointX, pointY, 1, 'mouse');
  await dispatchPointer('pointerup', pointX, pointY, 0, 'mouse');
});
