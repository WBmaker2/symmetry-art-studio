# Symmetry Art Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. If subagents are used in this workspace, follow `AGENTS.md`: subagents use `GPT-5.3-Codex-Spark` when available; orchestrator and review agents use the main model.

**Goal:** Build a 5-6학년 수학/미술 융합 웹앱 where students draw on an HTML5 Canvas and instantly see a mirrored decalcomanie stroke across vertical, horizontal, or diagonal symmetry axes.

**Architecture:** Create a Vite + React + TypeScript single-page app. Keep geometry in pure domain helpers, drawing behavior in one canvas-focused component, and classroom-facing UI in small presentational components. Use TDD for symmetry math and smoke tests for the drawing workflow so the app remains teachable and safe to iterate.

**Tech Stack:** Vite, React, TypeScript, HTML5 Canvas, Pointer Events, Vitest, React Testing Library, Playwright, lucide-react.

---

## File Structure

- Create: `package.json` - scripts, dependencies, and project metadata.
- Create: `index.html` - Vite entry document with Korean metadata.
- Create: `vite.config.ts` - Vite and Vitest configuration.
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configuration.
- Create: `src/main.tsx` - React mount entry.
- Create: `src/App.tsx` - top-level composition and studio state.
- Create: `src/App.test.tsx` - UI smoke tests for controls and learning status.
- Create: `src/styles.css` - responsive app layout, toolbar, canvas stage, and focus states.
- Create: `src/domain/symmetry.ts` - pure point reflection helpers for vertical, horizontal, and diagonal axes.
- Create: `src/domain/symmetry.test.ts` - TDD coverage for the symmetry helper.
- Create: `src/components/StudioToolbar.tsx` - axis, color, brush size, eraser, clear, and save controls.
- Create: `src/components/CanvasStage.tsx` - HTML5 Canvas rendering, pointer drawing, mirrored strokes, axis rendering, clear, and PNG export.
- Create: `src/components/LearningPanel.tsx` - concise achievement-standard aligned prompts and live drawing feedback.
- Create: `src/test/setup.ts` - Testing Library setup.
- Create: `playwright.config.ts` - local E2E configuration.
- Create: `tests/symmetry-art-studio.spec.ts` - browser smoke test for primary workflow and responsive canvas.
- Create: `README.md` - Korean app overview, classroom use, and local commands.

## Implementation Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Initialize git and Vite React TypeScript project**

Run:

```bash
git init
npm create vite@latest . -- --template react-ts
```

Expected:

```text
Initialized empty Git repository
Done. Now run:
  npm install
  npm run dev
```

- [ ] **Step 2: Install app, test, and browser QA dependencies**

Run:

```bash
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npm install lucide-react
```

Expected:

```text
added ... packages
found 0 vulnerabilities
```

- [ ] **Step 3: Replace package metadata and scripts**

Replace `package.json` with:

```json
{
  "name": "symmetry-art-studio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview",
    "e2e": "playwright test"
  },
  "dependencies": {
    "lucide-react": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "latest",
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 4: Configure Vite and Vitest**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const canvasContext = {
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  setLineDash: vi.fn(),
  stroke: vi.fn(),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => canvasContext),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/png;base64,symmetry-art-studio'),
});
```

- [ ] **Step 5: Add Korean metadata**

Replace `index.html` with:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="5-6학년 수학과 미술을 연결해 선대칭, 점대칭, 데칼코마니를 체험하는 대칭 아트 스튜디오"
    />
    <title>마법의 데칼코마니: 대칭 아트 스튜디오</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Run baseline checks**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected:

```text
Found 0 errors.
Test Files  0 passed
built in ...
```

If Vitest exits because there are no test files, continue to Task 2 and rerun after adding the first test.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json src/main.tsx src/test/setup.ts
git commit -m "chore: scaffold symmetry art studio"
```

Expected:

```text
[main ...] chore: scaffold symmetry art studio
```

### Task 2: Symmetry Geometry Domain

**Files:**
- Create: `src/domain/symmetry.ts`
- Create: `src/domain/symmetry.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/symmetry.test.ts`:

```ts
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
      x: 388,
      y: 84,
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/domain/symmetry.test.ts
```

Expected:

```text
FAIL  src/domain/symmetry.test.ts
Cannot find module './symmetry'
```

- [ ] **Step 3: Implement symmetry helpers**

Create `src/domain/symmetry.ts`:

```ts
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
```

- [ ] **Step 4: Run domain test to verify it passes**

Run:

```bash
npm test -- src/domain/symmetry.test.ts
```

Expected:

```text
PASS  src/domain/symmetry.test.ts
```

- [ ] **Step 5: Commit domain helpers**

Run:

```bash
git add src/domain/symmetry.ts src/domain/symmetry.test.ts
git commit -m "feat: add symmetry geometry helpers"
```

Expected:

```text
[main ...] feat: add symmetry geometry helpers
```

### Task 3: Toolbar Controls

**Files:**
- Create: `src/components/StudioToolbar.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing toolbar test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Symmetry Art Studio app shell', () => {
  it('lets students switch symmetry axes and drawing tools', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '가로 대칭축' }));
    expect(screen.getByRole('status')).toHaveTextContent('가로 대칭축');

    await user.click(screen.getByRole('button', { name: '지우개' }));
    expect(screen.getByRole('button', { name: '지우개' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '파랑' }));
    expect(screen.getByRole('button', { name: '파랑' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '지우개' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected:

```text
FAIL  src/App.test.tsx
Unable to find role="button" and name "가로 대칭축"
```

- [ ] **Step 3: Implement toolbar component**

Create `src/components/StudioToolbar.tsx`:

```tsx
import { Brush, Download, Eraser, RotateCcw, Slash } from 'lucide-react';
import { axisLabels, type AxisMode } from '../domain/symmetry';

export type DrawingTool = 'brush' | 'eraser';

export type ColorSwatch = {
  name: string;
  value: string;
};

type StudioToolbarProps = {
  axis: AxisMode;
  color: string;
  brushSize: number;
  tool: DrawingTool;
  colors: ColorSwatch[];
  onAxisChange: (axis: AxisMode) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  onSave: () => void;
};

const axisOptions: AxisMode[] = ['vertical', 'horizontal', 'diagonal'];

export function StudioToolbar({
  axis,
  color,
  brushSize,
  tool,
  colors,
  onAxisChange,
  onColorChange,
  onBrushSizeChange,
  onToolChange,
  onClear,
  onSave,
}: StudioToolbarProps) {
  return (
    <aside className="toolbar" aria-label="대칭 아트 도구">
      <section className="tool-group" aria-labelledby="axis-heading">
        <h2 id="axis-heading">대칭축</h2>
        <div className="segmented-control">
          {axisOptions.map((axisOption) => (
            <button
              className="segment-button"
              type="button"
              key={axisOption}
              aria-pressed={axis === axisOption}
              onClick={() => onAxisChange(axisOption)}
            >
              {axisLabels[axisOption]}
            </button>
          ))}
        </div>
      </section>

      <section className="tool-group" aria-labelledby="color-heading">
        <h2 id="color-heading">색상</h2>
        <div className="swatch-row">
          {colors.map((swatch) => (
            <button
              className="color-swatch"
              type="button"
              key={swatch.value}
              style={{ backgroundColor: swatch.value }}
              aria-label={swatch.name}
              aria-pressed={tool === 'brush' && color === swatch.value}
              onClick={() => {
                onColorChange(swatch.value);
                onToolChange('brush');
              }}
            />
          ))}
        </div>
      </section>

      <section className="tool-group" aria-labelledby="brush-heading">
        <h2 id="brush-heading">펜 굵기</h2>
        <label className="range-label">
          <Brush aria-hidden="true" size={18} />
          <input
            aria-label="펜 굵기"
            min="2"
            max="32"
            step="1"
            type="range"
            value={brushSize}
            onChange={(event) => onBrushSizeChange(Number(event.target.value))}
          />
          <span>{brushSize}px</span>
        </label>
      </section>

      <section className="tool-group compact-tools" aria-label="편집 도구">
        <button
          className="icon-button"
          type="button"
          aria-pressed={tool === 'eraser'}
          onClick={() => onToolChange(tool === 'eraser' ? 'brush' : 'eraser')}
          title="지우개"
        >
          <Eraser aria-hidden="true" size={18} />
          <span>지우개</span>
        </button>
        <button className="icon-button" type="button" onClick={onClear} title="전체 지우기">
          <RotateCcw aria-hidden="true" size={18} />
          <span>전체 지우기</span>
        </button>
        <button className="icon-button" type="button" onClick={onSave} title="PNG 저장">
          <Download aria-hidden="true" size={18} />
          <span>PNG 저장</span>
        </button>
      </section>

      <p className="axis-note">
        <Slash aria-hidden="true" size={16} />
        선택한 축을 기준으로 같은 길이와 방향 관계가 반사됩니다.
      </p>
    </aside>
  );
}
```

- [ ] **Step 4: Compose temporary app shell**

Replace `src/App.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { StudioToolbar, type ColorSwatch, type DrawingTool } from './components/StudioToolbar';
import { axisLabels, type AxisMode } from './domain/symmetry';
import './styles.css';

const colors: ColorSwatch[] = [
  { name: '검정', value: '#1f2937' },
  { name: '빨강', value: '#ef4444' },
  { name: '노랑', value: '#f59e0b' },
  { name: '초록', value: '#16a34a' },
  { name: '파랑', value: '#2563eb' },
  { name: '보라', value: '#7c3aed' },
];

export default function App() {
  const [axis, setAxis] = useState<AxisMode>('vertical');
  const [color, setColor] = useState(colors[0].value);
  const [brushSize, setBrushSize] = useState(10);
  const [tool, setTool] = useState<DrawingTool>('brush');

  const statusText = useMemo(
    () =>
      `${axisLabels[axis]} 선택됨. ${tool === 'eraser' ? '지우개' : '붓'} 도구로 작업 중입니다.`,
    [axis, tool],
  );

  return (
    <main className="app-shell">
      <section className="studio-heading" aria-labelledby="app-title">
        <p className="subject-line">5-6학년 수학 / 미술 융합</p>
        <h1 id="app-title">마법의 데칼코마니: 대칭 아트 스튜디오</h1>
        <p>
          한쪽에 선을 그리면 선택한 대칭축의 반대편에 같은 선이 실시간으로 나타납니다.
        </p>
      </section>

      <section className="workspace" aria-label="대칭 그리기 작업 영역">
        <StudioToolbar
          axis={axis}
          color={color}
          brushSize={brushSize}
          tool={tool}
          colors={colors}
          onAxisChange={setAxis}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onToolChange={setTool}
          onClear={() => undefined}
          onSave={() => undefined}
        />
        <div className="canvas-preview">캔버스 연결 준비 영역</div>
      </section>

      <p className="sr-status" role="status" aria-live="polite">
        {statusText}
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Run toolbar test to verify it passes**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected:

```text
PASS  src/App.test.tsx
```

- [ ] **Step 6: Commit toolbar**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/StudioToolbar.tsx
git commit -m "feat: add studio toolbar controls"
```

Expected:

```text
[main ...] feat: add studio toolbar controls
```

### Task 4: Canvas Drawing Stage

**Files:**
- Create: `src/components/CanvasStage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Extend UI smoke test for canvas commands**

Append this test to `src/App.test.tsx` inside the existing `describe` block:

```tsx
it('renders the drawing canvas and clear command', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByLabelText('대칭 그림 캔버스')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '전체 지우기' }));
  expect(screen.getByRole('status')).toHaveTextContent('캔버스를 비웠습니다');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected:

```text
FAIL  src/App.test.tsx
Unable to find a label with the text of: 대칭 그림 캔버스
```

- [ ] **Step 3: Implement canvas stage**

Create `src/components/CanvasStage.tsx`:

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { getAxisLine, reflectPoint, type AxisMode, type CanvasSize, type Point } from '../domain/symmetry';
import type { DrawingTool } from './StudioToolbar';

type CanvasStageProps = {
  axis: AxisMode;
  color: string;
  brushSize: number;
  tool: DrawingTool;
  clearSignal: number;
  onClearComplete: () => void;
  onStrokeChange: (message: string) => void;
};

type StrokeSegment = {
  from: Point;
  to: Point;
  color: string;
  brushSize: number;
  tool: DrawingTool;
  axis: AxisMode;
};

const canvasSize: CanvasSize = {
  width: 1200,
  height: 760,
};

function drawAxis(context: CanvasRenderingContext2D, axis: AxisMode) {
  const line = getAxisLine(axis, canvasSize);
  context.save();
  context.setLineDash([14, 12]);
  context.lineWidth = 4;
  context.strokeStyle = '#334155';
  context.beginPath();
  context.moveTo(line.start.x, line.start.y);
  context.lineTo(line.end.x, line.end.y);
  context.stroke();
  context.restore();
}

function drawSegment(context: CanvasRenderingContext2D, segment: StrokeSegment) {
  const reflectedFrom = reflectPoint(segment.from, segment.axis, canvasSize);
  const reflectedTo = reflectPoint(segment.to, segment.axis, canvasSize);

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = segment.tool === 'eraser' ? segment.brushSize * 1.35 : segment.brushSize;
  context.globalCompositeOperation =
    segment.tool === 'eraser' ? 'destination-out' : 'source-over';
  context.strokeStyle = segment.color;

  context.beginPath();
  context.moveTo(segment.from.x, segment.from.y);
  context.lineTo(segment.to.x, segment.to.y);
  context.stroke();

  context.beginPath();
  context.moveTo(reflectedFrom.x, reflectedFrom.y);
  context.lineTo(reflectedTo.x, reflectedTo.y);
  context.stroke();
  context.restore();
}

export function CanvasStage({
  axis,
  color,
  brushSize,
  tool,
  clearSignal,
  onClearComplete,
  onStrokeChange,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const strokesRef = useRef<StrokeSegment[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvasSize.width, canvasSize.height);
    context.fillStyle = '#fffdf8';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);
    strokesRef.current.forEach((segment) => drawSegment(context, segment));
    drawAxis(context, axis);
  }, [axis]);

  const getCanvasPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvasSize.width,
      y: ((event.clientY - rect.top) / rect.height) * canvasSize.height,
    };
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const clearSignalRef = useRef(clearSignal);

  useEffect(() => {
    if (clearSignalRef.current === clearSignal) {
      return;
    }

    clearSignalRef.current = clearSignal;
    strokesRef.current = [];
    redraw();
    onClearComplete();
  }, [clearSignal, onClearComplete, redraw]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
    onStrokeChange('그리기를 시작했습니다. 반대편에 대칭 그림이 함께 나타납니다.');
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPointRef.current) {
      return;
    }

    const nextPoint = getCanvasPoint(event);
    const segment: StrokeSegment = {
      from: lastPointRef.current,
      to: nextPoint,
      color,
      brushSize,
      tool,
      axis,
    };
    strokesRef.current.push(segment);

    const context = canvasRef.current?.getContext('2d');
    if (context) {
      drawSegment(context, segment);
      drawAxis(context, axis);
    }

    lastPointRef.current = nextPoint;
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    drawingRef.current = false;
    lastPointRef.current = null;
    onStrokeChange('획을 완성했습니다. 대칭축을 바꾸면 새 축으로 이어서 그릴 수 있습니다.');
  };

  const savePng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement('a');
    link.download = 'symmetry-art-studio.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    onStrokeChange('PNG 이미지로 저장했습니다.');
  }, [onStrokeChange]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('symmetry-art-save-ready', { detail: savePng }));
  }, [savePng]);

  return (
    <div className="canvas-stage">
      <canvas
        ref={canvasRef}
        aria-label="대칭 그림 캔버스"
        width={canvasSize.width}
        height={canvasSize.height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
    </div>
  );
}
```

- [ ] **Step 4: Connect canvas stage in app**

Replace `src/App.tsx` with:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { CanvasStage } from './components/CanvasStage';
import { StudioToolbar, type ColorSwatch, type DrawingTool } from './components/StudioToolbar';
import { axisLabels, type AxisMode } from './domain/symmetry';
import './styles.css';

const colors: ColorSwatch[] = [
  { name: '검정', value: '#1f2937' },
  { name: '빨강', value: '#ef4444' },
  { name: '노랑', value: '#f59e0b' },
  { name: '초록', value: '#16a34a' },
  { name: '파랑', value: '#2563eb' },
  { name: '보라', value: '#7c3aed' },
];

export default function App() {
  const [axis, setAxis] = useState<AxisMode>('vertical');
  const [color, setColor] = useState(colors[0].value);
  const [brushSize, setBrushSize] = useState(10);
  const [tool, setTool] = useState<DrawingTool>('brush');
  const [clearSignal, setClearSignal] = useState(0);
  const [activityMessage, setActivityMessage] = useState('세로 대칭축을 기준으로 시작해 보세요.');

  const statusText = useMemo(
    () => `${axisLabels[axis]} 선택됨. ${activityMessage}`,
    [activityMessage, axis],
  );

  const handleSave = useCallback(() => {
    window.dispatchEvent(new Event('symmetry-art-save-request'));
  }, []);

  return (
    <main className="app-shell">
      <section className="studio-heading" aria-labelledby="app-title">
        <p className="subject-line">5-6학년 수학 / 미술 융합</p>
        <h1 id="app-title">마법의 데칼코마니: 대칭 아트 스튜디오</h1>
        <p>
          한쪽에 선을 그리면 선택한 대칭축의 반대편에 같은 선이 실시간으로 나타납니다.
        </p>
      </section>

      <section className="workspace" aria-label="대칭 그리기 작업 영역">
        <StudioToolbar
          axis={axis}
          color={color}
          brushSize={brushSize}
          tool={tool}
          colors={colors}
          onAxisChange={(nextAxis) => {
            setAxis(nextAxis);
            setActivityMessage(`${axisLabels[nextAxis]}으로 바꾸었습니다.`);
          }}
          onColorChange={setColor}
          onBrushSizeChange={setBrushSize}
          onToolChange={setTool}
          onClear={() => {
            setClearSignal((value) => value + 1);
            setActivityMessage('캔버스를 비웠습니다.');
          }}
          onSave={handleSave}
        />
        <CanvasStage
          axis={axis}
          color={color}
          brushSize={brushSize}
          tool={tool}
          clearSignal={clearSignal}
          onClearComplete={() => undefined}
          onStrokeChange={setActivityMessage}
        />
      </section>

      <p className="sr-status" role="status" aria-live="polite">
        {statusText}
      </p>
    </main>
  );
}
```

- [ ] **Step 5: Wire save event without leaking globals**

In `src/components/CanvasStage.tsx`, replace the `symmetry-art-save-ready` effect with:

```tsx
useEffect(() => {
  const handleSaveRequest = () => savePng();
  window.addEventListener('symmetry-art-save-request', handleSaveRequest);

  return () => {
    window.removeEventListener('symmetry-art-save-request', handleSaveRequest);
  };
}, [savePng]);
```

- [ ] **Step 6: Run app tests**

Run:

```bash
npm test -- src/App.test.tsx src/domain/symmetry.test.ts
```

Expected:

```text
PASS  src/App.test.tsx
PASS  src/domain/symmetry.test.ts
```

- [ ] **Step 7: Commit canvas stage**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/CanvasStage.tsx
git commit -m "feat: draw mirrored canvas strokes"
```

Expected:

```text
[main ...] feat: draw mirrored canvas strokes
```

### Task 5: Classroom Visual Design and Learning Panel

**Files:**
- Create: `src/components/LearningPanel.tsx`
- Create: `src/styles.css`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing learning panel test**

Append this test to `src/App.test.tsx` inside the existing `describe` block:

```tsx
it('shows classroom learning prompts tied to symmetry and art standards', () => {
  render(<App />);

  expect(screen.getByText('[6수03-03]')).toBeInTheDocument();
  expect(screen.getByText('[6미02-02]')).toBeInTheDocument();
  expect(screen.getByText('관찰 질문')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected:

```text
FAIL  src/App.test.tsx
Unable to find an element with the text: [6수03-03]
```

- [ ] **Step 3: Implement learning panel**

Create `src/components/LearningPanel.tsx`:

```tsx
type LearningPanelProps = {
  activityMessage: string;
};

export function LearningPanel({ activityMessage }: LearningPanelProps) {
  return (
    <aside className="learning-panel" aria-label="수업 관찰 질문">
      <section>
        <h2>성취기준 연결</h2>
        <dl className="standard-list">
          <div>
            <dt>[6수03-03]</dt>
            <dd>선대칭도형과 점대칭도형의 성질을 탐구하고 설명합니다.</dd>
          </div>
          <div>
            <dt>[6미02-02]</dt>
            <dd>데칼코마니처럼 다양한 발상 방법으로 아이디어를 발전시킵니다.</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>관찰 질문</h2>
        <ul>
          <li>원래 선과 반사된 선은 대칭축에서 같은 거리에 있나요?</li>
          <li>대칭축을 바꾸면 그림의 느낌과 규칙이 어떻게 달라지나요?</li>
          <li>지우개도 대칭으로 작동할 때 어떤 수학 성질을 볼 수 있나요?</li>
        </ul>
      </section>

      <section>
        <h2>현재 작업</h2>
        <p>{activityMessage}</p>
      </section>
    </aside>
  );
}
```

- [ ] **Step 4: Add finished app styling**

Replace `src/styles.css` with:

```css
:root {
  font-family:
    Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172033;
  background: #f6f8fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --ink: #172033;
  --muted: #5b6475;
  --panel: #ffffff;
  --line: #d7deea;
  --canvas: #fffdf8;
  --focus: #f59e0b;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  padding: 28px;
}

.studio-heading {
  max-width: 1120px;
  margin: 0 auto 20px;
}

.subject-line {
  margin: 0 0 8px;
  color: var(--accent-strong);
  font-size: 0.9rem;
  font-weight: 700;
}

.studio-heading h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1.08;
  letter-spacing: 0;
}

.studio-heading p:last-child {
  max-width: 720px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.6;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(240px, 300px);
  gap: 18px;
  max-width: 1440px;
  margin: 0 auto;
  align-items: start;
}

.toolbar,
.learning-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 18px;
  box-shadow: 0 14px 35px rgba(23, 32, 51, 0.08);
}

.tool-group + .tool-group,
.learning-panel section + section {
  margin-top: 18px;
}

.tool-group h2,
.learning-panel h2 {
  margin: 0 0 10px;
  font-size: 0.92rem;
  line-height: 1.3;
}

.segmented-control {
  display: grid;
  gap: 8px;
}

.segment-button,
.icon-button {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fafc;
  color: var(--ink);
  font-weight: 700;
}

.segment-button[aria-pressed='true'],
.icon-button[aria-pressed='true'] {
  border-color: var(--accent);
  background: #dbeafe;
  color: var(--accent-strong);
}

.swatch-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-swatch {
  aspect-ratio: 1;
  min-width: 32px;
  border: 3px solid #ffffff;
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--line);
}

.color-swatch[aria-pressed='true'] {
  box-shadow:
    0 0 0 2px var(--accent),
    0 8px 16px rgba(37, 99, 235, 0.22);
}

.range-label {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  color: var(--muted);
  font-size: 0.92rem;
}

.range-label input {
  width: 100%;
  accent-color: var(--accent);
}

.compact-tools {
  display: grid;
  gap: 8px;
}

.icon-button {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.axis-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.canvas-stage {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
    var(--canvas);
  background-size: 40px 40px;
  box-shadow: 0 18px 42px rgba(23, 32, 51, 0.1);
}

.canvas-stage canvas {
  display: block;
  width: 100%;
  height: auto;
  touch-action: none;
}

.standard-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.standard-list div {
  display: grid;
  gap: 4px;
}

.standard-list dt {
  color: var(--accent-strong);
  font-weight: 800;
}

.standard-list dd {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.learning-panel ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.45;
}

.learning-panel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.sr-status {
  position: fixed;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}

@media (max-width: 1080px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .toolbar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .tool-group + .tool-group {
    margin-top: 0;
  }

  .axis-note {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .app-shell {
    padding: 18px;
  }

  .studio-heading h1 {
    font-size: 2rem;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .axis-note {
    grid-column: auto;
  }
}
```

- [ ] **Step 5: Place learning panel in app**

In `src/App.tsx`, add the import:

```tsx
import { LearningPanel } from './components/LearningPanel';
```

Then add this after `<CanvasStage ... />` inside `.workspace`:

```tsx
<LearningPanel activityMessage={activityMessage} />
```

- [ ] **Step 6: Run tests and type check**

Run:

```bash
npm test
npm run lint
```

Expected:

```text
PASS  src/App.test.tsx
PASS  src/domain/symmetry.test.ts
Found 0 errors.
```

- [ ] **Step 7: Commit learning UI**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/LearningPanel.tsx src/styles.css
git commit -m "feat: add classroom learning interface"
```

Expected:

```text
[main ...] feat: add classroom learning interface
```

### Task 6: Browser Workflow Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/symmetry-art-studio.spec.ts`

- [ ] **Step 1: Add Playwright configuration**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
```

- [ ] **Step 2: Write E2E smoke test**

Create `tests/symmetry-art-studio.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('student can draw, switch axes, and clear the studio', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '마법의 데칼코마니: 대칭 아트 스튜디오' })).toBeVisible();
  const canvas = page.getByLabel('대칭 그림 캔버스');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Canvas bounding box was not available');
  }

  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.48);
  await page.mouse.move(box.x + box.width * 0.38, box.y + box.height * 0.37);
  await page.mouse.up();

  await expect(page.getByRole('status')).toContainText('획을 완성했습니다');

  await page.getByRole('button', { name: '대각선 대칭축' }).click();
  await expect(page.getByRole('status')).toContainText('대각선 대칭축');

  await page.getByRole('button', { name: '전체 지우기' }).click();
  await expect(page.getByRole('status')).toContainText('캔버스를 비웠습니다');
});
```

- [ ] **Step 3: Run E2E test**

Run:

```bash
npm run e2e
```

Expected:

```text
2 passed
```

- [ ] **Step 4: Build production bundle**

Run:

```bash
npm run build
```

Expected:

```text
dist/index.html
built in ...
```

- [ ] **Step 5: Commit browser tests**

Run:

```bash
git add playwright.config.ts tests/symmetry-art-studio.spec.ts
git commit -m "test: cover symmetry studio browser workflow"
```

Expected:

```text
[main ...] test: cover symmetry studio browser workflow
```

### Task 7: Documentation and Release Readiness

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Symmetry Art Studio

마법의 데칼코마니: 대칭 아트 스튜디오는 5-6학년 수학과 미술을 연결해 선대칭도형의 성질을 직접 그리며 탐구하는 웹앱입니다.

## 수업 연결

- 수학: `[6수03-03]` 선대칭도형과 점대칭도형의 의미와 성질 탐구
- 미술: `[6미02-02]` 다양한 발상 방법으로 아이디어 발전

## 주요 기능

- HTML5 Canvas 기반 자유 그리기
- 세로, 가로, 대각선 대칭축 전환
- 실시간 반사 그림 렌더링
- 색상 팔레트, 펜 굵기 조절, 지우개
- 전체 지우기와 PNG 저장
- 수업 관찰 질문과 접근성 상태 메시지

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run lint
npm run build
npm run e2e
```

## 수업 운영 팁

1. 세로 대칭축에서 간단한 선을 그리고 양쪽 점이 대칭축에서 같은 거리에 있는지 묻습니다.
2. 가로 대칭축으로 바꾸어 위아래 반사가 어떻게 달라지는지 비교합니다.
3. 대각선 대칭축에서는 선의 방향이 어떻게 바뀌는지 관찰하게 합니다.
4. 완성한 그림을 PNG로 저장해 미술 활동 결과물로 공유합니다.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
npm run e2e
```

Expected:

```text
PASS  src/App.test.tsx
PASS  src/domain/symmetry.test.ts
Found 0 errors.
built in ...
2 passed
```

- [ ] **Step 3: Commit documentation**

Run:

```bash
git add README.md
git commit -m "docs: document symmetry art studio"
```

Expected:

```text
[main ...] docs: document symmetry art studio
```

## Self-Review Checklist

- [ ] The plan covers drawing area, real-time mirrored rendering, vertical/horizontal/diagonal axes, colors, brush size, eraser, clear, and save controls.
- [ ] The plan separates pure geometry from canvas rendering so math behavior can be tested without a browser.
- [ ] The plan includes Korean classroom UI copy and both achievement standards.
- [ ] The plan includes accessible labels, `role="status"`, keyboard-focus styles, and browser smoke coverage.
- [ ] The plan avoids backend, accounts, class rosters, or storage because the requested first version is a single-student creative canvas.
- [ ] The plan ends with `npm test`, `npm run lint`, `npm run build`, and `npm run e2e` verification.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-symmetry-art-studio.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, and use `GPT-5.3-Codex-Spark` for subagents when available per workspace instructions.
2. **Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, with checkpoints after each major feature.
