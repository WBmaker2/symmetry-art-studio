import { describe, expect, it } from 'vitest';
import {
  distanceToAxis,
  getSymmetryPointGuide,
  projectPointToAxis,
  reflectPoint,
  type AxisMode,
  type Point,
} from './symmetry';

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

describe('projectPointToAxis', () => {
  it('projects a point to the vertical axis', () => {
    expect(projectPointToAxis({ x: 140, y: 240 }, 'vertical', canvas)).toEqual({
      x: 400,
      y: 240,
    });
  });

  it('projects a point to the horizontal axis', () => {
    expect(projectPointToAxis({ x: 200, y: 120 }, 'horizontal', canvas)).toEqual({
      x: 200,
      y: 300,
    });
  });

  it('projects a point to the diagonal axis', () => {
    expect(rounded(projectPointToAxis({ x: 100, y: 300 }, 'diagonal', canvas))).toEqual({
      x: 208,
      y: 156,
    });
  });
});

describe('distanceToAxis', () => {
  it('returns zero for an axis-aligned point', () => {
    expect(distanceToAxis({ x: 400, y: 300 }, 'vertical', canvas)).toBe(0);
    expect(distanceToAxis({ x: 200, y: 300 }, 'horizontal', canvas)).toBe(0);
  });

  it('returns equal distances for a point and its reflection', () => {
    const leftPoint = { x: 180, y: 240 };
    const guide = getSymmetryPointGuide(leftPoint, 'vertical', canvas);
    expect(guide.originalDistance).toBeCloseTo(220);
    expect(guide.reflectedDistance).toBeCloseTo(220);
    expect(guide.sameDistance).toBe(true);
  });
});

describe('getSymmetryPointGuide', () => {
  it('returns original and reflected points with a foot point', () => {
    expect(getSymmetryPointGuide({ x: 140, y: 240 }, 'vertical', canvas)).toMatchObject(
      {
        original: { x: 140, y: 240 },
        reflected: { x: 660, y: 240 },
        footPoint: { x: 400, y: 240 },
      },
    );
  });

  it('keeps reflected-distance metadata consistent', () => {
    const guide = getSymmetryPointGuide({ x: 100, y: 300 }, 'diagonal', canvas);
    expect(guide.sameDistance).toBe(true);
    expect(guide.originalDistance).toBeCloseTo(guide.reflectedDistance);
  });
});
