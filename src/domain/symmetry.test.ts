import { describe, expect, it } from 'vitest';
import { reflectPoint, type AxisMode, type Point } from './symmetry';

const canvas = { width: 800, height: 600 };

const rounded = (point: Point): Point => ({
  x: Math.round(point.x),
  y: Math.round(point.y),
});

describe('reflectPoint', () => {
  it('reflects a point across the vertical center axis', () => {
    expect(reflectPoint({ x: 120, y: 240 }, 'vertical', canvas)).toEqual({
      x: 680,
      y: 240,
    });
  });

  it('reflects a point across the horizontal center axis', () => {
    expect(reflectPoint({ x: 120, y: 90 }, 'horizontal', canvas)).toEqual({
      x: 120,
      y: 510,
    });
  });

  it('reflects a point across the top-left to bottom-right diagonal axis', () => {
    expect(rounded(reflectPoint({ x: 100, y: 300 }, 'diagonal', canvas))).toEqual({
      x: 316,
      y: 12,
    });
  });

  it('keeps a point unchanged when it is on the selected axis', () => {
    const axes: AxisMode[] = ['vertical', 'horizontal', 'diagonal'];

    expect(reflectPoint({ x: 400, y: 140 }, axes[0], canvas)).toEqual({
      x: 400,
      y: 140,
    });
    expect(reflectPoint({ x: 240, y: 300 }, axes[1], canvas)).toEqual({
      x: 240,
      y: 300,
    });
    expect(rounded(reflectPoint({ x: 400, y: 300 }, axes[2], canvas))).toEqual({
      x: 400,
      y: 300,
    });
  });
});
