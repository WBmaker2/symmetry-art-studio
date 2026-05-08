export type AxisMode = 'vertical' | 'horizontal' | 'diagonal';

export type Point = {
  x: number;
  y: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type AxisLine = {
  start: Point;
  end: Point;
};

export const axisLabels: Record<AxisMode, string> = {
  vertical: '세로 대칭축',
  horizontal: '가로 대칭축',
  diagonal: '대각선 대칭축',
};

export function reflectPoint(point: Point, axis: AxisMode, size: CanvasSize): Point {
  if (axis === 'vertical') {
    return { x: size.width - point.x, y: point.y };
  }

  if (axis === 'horizontal') {
    return { x: point.x, y: size.height - point.y };
  }

  const center: Point = {
    x: size.width / 2,
    y: size.height / 2,
  };
  const axisVector = {
    x: size.width,
    y: size.height,
  };
  const lengthSquared = axisVector.x ** 2 + axisVector.y ** 2;
  const translated = {
    x: point.x - center.x,
    y: point.y - center.y,
  };
  const projectionScale =
    (translated.x * axisVector.x + translated.y * axisVector.y) / lengthSquared;
  const projection = {
    x: projectionScale * axisVector.x,
    y: projectionScale * axisVector.y,
  };

  return {
    x: center.x + 2 * projection.x - translated.x,
    y: center.y + 2 * projection.y - translated.y,
  };
}

export function getAxisLine(axis: AxisMode, size: CanvasSize): AxisLine {
  if (axis === 'vertical') {
    return {
      start: { x: size.width / 2, y: 0 },
      end: { x: size.width / 2, y: size.height },
    };
  }

  if (axis === 'horizontal') {
    return {
      start: { x: 0, y: size.height / 2 },
      end: { x: size.width, y: size.height / 2 },
    };
  }

  return {
    start: { x: 0, y: 0 },
    end: { x: size.width, y: size.height },
  };
}
