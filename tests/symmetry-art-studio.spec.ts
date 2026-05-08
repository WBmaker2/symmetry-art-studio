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

  await expect(page.getByRole('status')).toContainText('획을 완성했습니다');

  await page.getByRole('button', { name: '대각선 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('대각선 대칭축');

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');
});
