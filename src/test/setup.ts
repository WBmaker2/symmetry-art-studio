import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

export type CanvasContextMock = {
  beginPath: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  strokeRect: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
};

export const canvasContext: CanvasContextMock = {
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  strokeRect: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 }) as TextMetrics),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setLineDash: vi.fn(),
  stroke: vi.fn(),
} as const;

export const toDataURLMock = vi.fn(
  () => 'data:image/png;base64,symmetry-art-studio',
);

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => canvasContext),
  configurable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: toDataURLMock,
  configurable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'setPointerCapture', {
  value: vi.fn(function (_pointerId: number) {
    return undefined;
  }),
  configurable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'releasePointerCapture', {
  value: vi.fn(function (_pointerId: number) {
    return undefined;
  }),
  configurable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 960,
    height: 960,
    right: 960,
    bottom: 960,
    x: 0,
    y: 0,
    toJSON: () => '',
  })),
  configurable: true,
});

Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
  value: vi.fn(),
  configurable: true,
});

export const resetCanvasMocks = () => {
  vi.clearAllMocks();
};
