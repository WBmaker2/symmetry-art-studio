import { expect, test } from '@playwright/test';

const PRIMARY_TOOL_BUTTONS = [
  '점 탐구',
  '거리 힌트',
  '작품 카드 저장',
  '공유 문구 복사',
  '전체 지우기',
];

type PointerKind = 'pen' | 'mouse' | 'touch';

test('student can draw, switch axes, and clear the studio', async ({ page }, testInfo) => {
  await page.goto('/');
  const isTablet = testInfo.project.name === 'tablet';
  const isMobile = testInfo.project.name === 'mobile';
  const drawingPointerType: PointerKind = isTablet ? 'touch' : 'pen';

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

  const assertNoHorizontalOverflow = async () => {
    const overflow = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      workspaceScrollWidth: document.querySelector('.workspace')?.scrollWidth ?? 0,
      shellScrollWidth: document.querySelector('.app-shell')?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));

    expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    expect(overflow.workspaceScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    expect(overflow.shellScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  };

  const assertPrimaryTouchTargets = async () => {
    for (const buttonName of PRIMARY_TOOL_BUTTONS) {
      const button = page.getByRole('button', { name: buttonName });
      await expect(button).toBeVisible();
      const buttonBox = await button.boundingBox();
      expect(buttonBox).not.toBeNull();
      if (!buttonBox) {
        throw new Error(`Button "${buttonName}" bounding box was not available`);
      }

      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  };

  const assertTabletTouchEnvironment = async () => {
    const touchEnvironment = await page.evaluate(() => ({
      hasTouchPoints: navigator.maxTouchPoints > 0,
      hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
    }));

    expect(touchEnvironment.hasTouchPoints || touchEnvironment.hasCoarsePointer).toBe(
      true,
    );
  };

  const assertTouchCanvasNoPageScroll = async () => {
    const startX = box.x + box.width * 0.24;
    const startY = box.y + box.height * 0.32;
    const endX = box.x + box.width * 0.42;
    const endY = box.y + box.height * 0.5;
    const scrollBefore = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));

    await canvas.dispatchEvent('pointerdown', {
      pointerId: 77,
      pointerType: drawingPointerType,
      isPrimary: true,
      clientX: startX,
      clientY: startY,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    await canvas.dispatchEvent('pointermove', {
      pointerId: 77,
      pointerType: drawingPointerType,
      isPrimary: true,
      clientX: endX,
      clientY: endY,
      buttons: 1,
      bubbles: true,
      cancelable: true,
    });
    await canvas.dispatchEvent('pointerup', {
      pointerId: 77,
      pointerType: drawingPointerType,
      isPrimary: true,
      clientX: endX,
      clientY: endY,
      buttons: 0,
      bubbles: true,
      cancelable: true,
    });

    const scrollAfter = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));
    expect(scrollAfter).toEqual(scrollBefore);
  };

  const canvasTouchAction = await canvas.evaluate((element) => {
    return getComputedStyle(element).touchAction;
  });
  expect(canvasTouchAction).toBe('none');

  if (isTablet || isMobile) {
    await assertNoHorizontalOverflow();
    await assertPrimaryTouchTargets();
  }

  if (isTablet) {
    await assertTabletTouchEnvironment();
    await assertTouchCanvasNoPageScroll();
  }

  const hasInitialGridPixel = async () =>
    canvas.evaluate((element) => {
      const background = { r: 255, g: 253, b: 248 };
      const canvas = element as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) {
        return false;
      }

      const x = Math.round((280 / 960) * canvas.width);
      const y = Math.round((400 / 960) * canvas.height);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const pixel = context.getImageData(x + dx, y + dy, 1, 1).data;
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
    });

  await expect.poll(hasInitialGridPixel).toBe(true);

  const dispatchPointer = async (
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    x: number,
    y: number,
    buttons: number,
    pointerType: PointerKind = drawingPointerType,
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

  const clickCanvasFraction = async (
    xFraction: number,
    yFraction: number,
    pointerType: PointerKind = drawingPointerType,
  ) => {
    const currentBox = await canvas.boundingBox();
    expect(currentBox).not.toBeNull();
    if (!currentBox) {
      throw new Error('Canvas bounding box was not available');
    }

    const x = currentBox.x + currentBox.width * xFraction;
    const y = currentBox.y + currentBox.height * yFraction;
    await dispatchPointer('pointerdown', x, y, 1, pointerType);
    await dispatchPointer('pointerup', x, y, 0, pointerType);
    return { xFraction, yFraction };
  };

  const tapCanvasFraction = async (xFraction: number, yFraction: number) => {
    await canvas.scrollIntoViewIfNeeded();
    const currentBox = await canvas.boundingBox();
    expect(currentBox).not.toBeNull();
    if (!currentBox) {
      throw new Error('Canvas bounding box was not available');
    }

    const x = currentBox.x + currentBox.width * xFraction;
    const y = currentBox.y + currentBox.height * yFraction;
    const scrollBefore = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));

    await page.touchscreen.tap(x, y);

    const scrollAfter = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));
    expect(scrollAfter).toEqual(scrollBefore);

    return { xFraction, yFraction };
  };

  const drawCanvasLineFraction = async (
    start: { x: number; y: number },
    end: { x: number; y: number },
    pointerType: PointerKind = drawingPointerType,
  ) => {
    const currentBox = await canvas.boundingBox();
    expect(currentBox).not.toBeNull();
    if (!currentBox) {
      throw new Error('Canvas bounding box was not available');
    }

    const startX = currentBox.x + currentBox.width * start.x;
    const startY = currentBox.y + currentBox.height * start.y;
    const endX = currentBox.x + currentBox.width * end.x;
    const endY = currentBox.y + currentBox.height * end.y;
    await dispatchPointer('pointerdown', startX, startY, 1, pointerType);
    await dispatchPointer('pointermove', endX, endY, 1, pointerType);
    await dispatchPointer('pointerup', endX, endY, 0, pointerType);
  };

  const brushColor = { r: 31, g: 41, b: 55 };
  const reflectedPointColor = { r: 15, g: 118, b: 110 };
  const gridSample = { x: 280 / 960, y: 480 / 960 };
  const strokeStart = { x: 0.235, y: 0.415 };
  const strokeMid = { x: 0.315, y: 0.485 };
  const strokeEnd = { x: 0.385, y: 0.365 };
  const penVerificationStrokeStart = { x: 0.65, y: 0.72 };
  const penVerificationStrokeMid = { x: 0.73, y: 0.8 };
  const penVerificationStrokeEnd = { x: 0.81, y: 0.68 };
  const startX = box.x + box.width * strokeStart.x;
  const startY = box.y + box.height * strokeStart.y;
  const midX = box.x + box.width * strokeMid.x;
  const midY = box.y + box.height * strokeMid.y;
  const endX = box.x + box.width * strokeEnd.x;
  const endY = box.y + box.height * strokeEnd.y;

  await dispatchPointer('pointerdown', startX, startY, 1, drawingPointerType);
  await dispatchPointer('pointermove', midX, midY, 1, drawingPointerType);
  await dispatchPointer('pointermove', endX, endY, 1, drawingPointerType);
  await dispatchPointer('pointerup', endX, endY, 0, drawingPointerType);

  const isPaintedPoint = async (
    xFraction: number,
    yFraction: number,
    expectedColor?: { r: number; g: number; b: number },
  ) =>
    canvas.evaluate(
      (element, { xFraction, yFraction, expectedColor }) => {
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
            const hasExpectedColor =
              !expectedColor ||
              (Math.abs(pixel[0] - expectedColor.r) <= 8 &&
                Math.abs(pixel[1] - expectedColor.g) <= 8 &&
                Math.abs(pixel[2] - expectedColor.b) <= 8);
            if (
              pixel[3] > 0 &&
              hasExpectedColor &&
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
      { xFraction, yFraction, expectedColor },
    );

  const isGridGuidePixel = async (xFraction: number, yFraction: number) =>
    canvas.evaluate(
      (element, { xFraction, yFraction }) => {
        const canvas = element as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        if (!context) {
          return false;
        }

        const x = Math.round(canvas.width * xFraction);
        const y = Math.round(canvas.height * yFraction);
        const pixel = context.getImageData(x, y, 1, 1).data;

        return (
          pixel[3] > 0 &&
          pixel[0] < 245 &&
          pixel[1] < 245 &&
          pixel[2] > 230 &&
          pixel[2] > pixel[0]
        );
      },
      { xFraction, yFraction },
    );

  const isPainted = await isPaintedPoint(strokeStart.x, strokeStart.y, brushColor);
  const reflectedIsPainted = await isPaintedPoint(
    1 - strokeStart.x,
    strokeStart.y,
    brushColor,
  );

  expect(isPainted).toBe(true);
  expect(reflectedIsPainted).toBe(true);
  await expect(page.getByRole('status')).toContainText('획을 완성했습니다');

  if (isTablet) {
    await page.getByRole('button', { name: '전체 지우기' }).click();
    await expect(page.getByRole('status')).toContainText(
      '한 번 더 누르면 캔버스를 비웁니다',
    );
    await page.getByRole('button', { name: '전체 지우기 확인' }).click();
    await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');

    await drawCanvasLineFraction(
      penVerificationStrokeStart,
      penVerificationStrokeMid,
      'pen',
    );
    await drawCanvasLineFraction(
      penVerificationStrokeMid,
      penVerificationStrokeEnd,
      'pen',
    );
    expect(
      await isPaintedPoint(penVerificationStrokeStart.x, penVerificationStrokeStart.y, brushColor),
    ).toBe(true);
    expect(
      await isPaintedPoint(
        1 - penVerificationStrokeStart.x,
        penVerificationStrokeStart.y,
        brushColor,
      ),
    ).toBe(true);
  }

  await drawCanvasLineFraction(
    { x: 0.2, y: gridSample.y },
    { x: 0.38, y: gridSample.y },
    drawingPointerType,
  );
  expect(await isPaintedPoint(gridSample.x, gridSample.y, brushColor)).toBe(true);

  await page.getByRole('button', { name: '지우개' }).click();
  await expect(page.getByRole('button', { name: '지우개' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await drawCanvasLineFraction(
    { x: 0.2, y: gridSample.y },
    { x: 0.38, y: gridSample.y },
    drawingPointerType,
  );
  expect(await isGridGuidePixel(gridSample.x, gridSample.y)).toBe(true);

  await page.getByRole('button', { name: '검정' }).click();
  await expect(page.getByRole('button', { name: '지우개' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  await page.getByRole('radio', { name: '대각선 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('대각선 대칭축');

  await page.getByRole('radio', { name: '세로 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('세로 대칭축');

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('한 번 더 누르면 캔버스를 비웁니다');

  await page.getByRole('button', { name: '전체 지우기 확인' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');

  await page.getByRole('button', { name: '점 탐구' }).click();

  await expect(page.getByRole('button', { name: '점 탐구' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '거리 힌트' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  const firstPoint = isTablet
    ? await tapCanvasFraction(0.22, 0.5)
    : await clickCanvasFraction(0.22, 0.5, drawingPointerType);
  const reflectedXFraction = 1 - firstPoint.xFraction;
  const noHintGuideXFraction = (firstPoint.xFraction + 0.5) / 2;

  await expect
    .poll(() => isPaintedPoint(firstPoint.xFraction, firstPoint.yFraction, brushColor))
    .toBe(true);
  await expect
    .poll(() =>
      isPaintedPoint(reflectedXFraction, firstPoint.yFraction, reflectedPointColor),
    )
    .toBe(true);
  expect(
    await isPaintedPoint(noHintGuideXFraction, firstPoint.yFraction, reflectedPointColor),
  ).toBe(false);

  await page.getByRole('button', { name: '거리 힌트' }).click();
  await expect(page.getByRole('button', { name: '거리 힌트' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('status')).toContainText(
    '거리 힌트를 켰습니다. 점 탐구 모드일 때 가이드가 보여집니다.',
  );

  const secondPoint = await clickCanvasFraction(0.26, 0.64, drawingPointerType);
  await expect(page.getByRole('status')).toContainText(
    '원본점과 대칭점은 대칭축에서 같은 거리에 있습니다.',
  );
  await expect(page.locator('[aria-label="수업 관찰 질문"]')).toContainText(
    '원본점과 대칭점은 대칭축에서 같은 거리에 있습니다.',
  );

  const guideXFraction = (secondPoint.xFraction + 0.5) / 2;
  expect(
    await isPaintedPoint(guideXFraction, secondPoint.yFraction, reflectedPointColor),
  ).toBe(true);

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('한 번 더 누르면 캔버스를 비웁니다');
  await page.getByRole('button', { name: '전체 지우기 확인' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');
  expect(await isPaintedPoint(firstPoint.xFraction, firstPoint.yFraction, brushColor)).toBe(
    false,
  );
});
