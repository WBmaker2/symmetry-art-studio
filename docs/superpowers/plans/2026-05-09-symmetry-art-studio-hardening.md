# Symmetry Art Studio Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수업 현장에서 더 안전하게 쓸 수 있도록 대칭 그리기 입력 안정성, 실수 복구, 학습 흐름, 접근성, 배포 검증을 보강한다.

**Architecture:** 기존 React + Canvas 구조를 유지하되, 캔버스 내부 히스토리를 `CanvasStage`가 책임지고 `App`은 수업 상태 메시지만 관리한다. UI 제어는 `StudioToolbar`, 학습 단계는 `LearningPanel`, 배포 검증은 독립 Node 스크립트로 분리한다.

**Tech Stack:** React, TypeScript, HTML5 Canvas, Vitest, Testing Library, Playwright, GitHub Actions, Vite.

---

## File Structure

- Modify: `src/components/CanvasStage.tsx`
  - active pointer 추적, undo/redo 히스토리, clear 확정 처리, 저장 요청 함수를 담당한다.
- Modify: `src/components/StudioToolbar.tsx`
  - Undo/Redo 버튼, clear 확인 버튼, 대칭축 radiogroup, 색상 라벨을 담당한다.
- Modify: `src/components/LearningPanel.tsx`
  - 단계형 수업 미션 체크리스트를 표시한다.
- Modify: `src/App.tsx`
  - toolbar와 canvas 사이의 명시적 요청 신호, 상태 메시지, 미션 상태를 연결한다.
- Modify: `src/styles.css`
  - 새 버튼/미션/색상 라벨 반응형 스타일을 추가한다.
- Modify: `src/App.test.tsx`, `src/test/setup.ts`, `tests/symmetry-art-studio.spec.ts`
  - undo/redo, clear 확인, active pointer, 학습 미션, 접근성 역할, 실제 canvas pixel 흐름을 검증한다.
- Create: `scripts/verify-pages.mjs`
  - GitHub Pages 배포 URL에서 HTML, 핵심 텍스트, JS/CSS 자산 응답을 확인한다.
- Modify: `package.json`, `.github/workflows/deploy-pages.yml`, `README.md`, `.gitignore`
  - CI E2E/smoke, 검증 명령, 공개 URL, 임시 산출물 ignore를 정리한다.

---

### Task 1: Canvas Input Safety and Recovery Controls

**Files:**
- Modify: `src/components/CanvasStage.tsx`
- Modify: `src/components/StudioToolbar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/test/setup.ts`
- Test: `npm test -- src/App.test.tsx`

- [ ] **Step 1: Write failing tests for recovery controls and pointer ownership**

Add tests in `src/App.test.tsx` that expect:

```tsx
it('requires confirmation before clearing and supports undo/redo', async () => {
  const user = userEvent.setup();
  render(<App />);

  const canvas = screen.getByLabelText('대칭 그림 캔버스');
  fireEvent.pointerDown(canvas, { pointerId: 7, clientX: 240, clientY: 240 });
  fireEvent.pointerMove(canvas, { pointerId: 7, clientX: 320, clientY: 320 });
  fireEvent.pointerUp(canvas, { pointerId: 7, clientX: 320, clientY: 320 });

  await user.click(screen.getByRole('button', { name: '되돌리기' }));
  expect(screen.getByRole('status')).toHaveTextContent('마지막 획을 되돌렸습니다');

  await user.click(screen.getByRole('button', { name: '다시 실행' }));
  expect(screen.getByRole('status')).toHaveTextContent('되돌린 획을 다시 그렸습니다');

  await user.click(screen.getByRole('button', { name: '전체 지우기' }));
  expect(screen.getByRole('status')).toHaveTextContent('한 번 더 누르면 캔버스를 비웁니다');

  await user.click(screen.getByRole('button', { name: '전체 지우기 확인' }));
  expect(screen.getByRole('status')).toHaveTextContent('캔버스를 비웠습니다');
});

it('ignores pointer moves from non-active pointers', () => {
  render(<App />);

  const canvas = screen.getByLabelText('대칭 그림 캔버스');
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 200, clientY: 200 });
  fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 700, clientY: 700 });
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 260, clientY: 260 });
  fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 260, clientY: 260 });

  expect(canvasContext.lineTo).not.toHaveBeenCalledWith(700, 700);
  expect(canvasContext.lineTo).toHaveBeenCalledWith(260, 260);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `되돌리기`, `다시 실행`, `전체 지우기 확인`, and active pointer filtering do not exist yet.

- [ ] **Step 3: Implement CanvasStage history and request signals**

Change `CanvasStageProps` to include explicit signals and state feedback:

```ts
undoSignal: number;
redoSignal: number;
saveSignal: number;
onUndoComplete: (message: string) => void;
onRedoComplete: (message: string) => void;
onSaveComplete: (message: string) => void;
onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
```

Inside `CanvasStage`, replace a single segment array with stroke groups:

```ts
type Stroke = {
  id: number;
  segments: StrokeSegment[];
};

const activePointerIdRef = useRef<number | null>(null);
const activeStrokeRef = useRef<Stroke | null>(null);
const strokesRef = useRef<Stroke[]>([]);
const undoneStrokesRef = useRef<Stroke[]>([]);
```

Implement pointer ownership:

```ts
if (activePointerIdRef.current !== null && activePointerIdRef.current !== event.pointerId) {
  return;
}
```

On clear, reset all drawing refs:

```ts
strokesRef.current = [];
undoneStrokesRef.current = [];
activeStrokeRef.current = null;
activePointerIdRef.current = null;
isDrawingRef.current = false;
lastPointRef.current = null;
```

Add undo/redo effects:

```ts
const undoLastStroke = () => {
  const stroke = strokesRef.current.pop();
  if (!stroke) return '되돌릴 획이 없습니다.';
  undoneStrokesRef.current.push(stroke);
  redraw();
  return '마지막 획을 되돌렸습니다.';
};

const redoLastStroke = () => {
  const stroke = undoneStrokesRef.current.pop();
  if (!stroke) return '다시 실행할 획이 없습니다.';
  strokesRef.current.push(stroke);
  redraw();
  return '되돌린 획을 다시 그렸습니다.';
};
```

- [ ] **Step 4: Implement toolbar controls and clear confirmation**

Add `Undo2` and `Redo2` icons from `lucide-react`. Add props:

```ts
canUndo: boolean;
canRedo: boolean;
clearPending: boolean;
onUndo: () => void;
onRedo: () => void;
```

Render buttons with stable accessible names:

```tsx
<button type="button" className="icon-button" onClick={onUndo} disabled={!canUndo}>
  <Undo2 aria-hidden="true" size={18} />
  되돌리기
</button>
<button type="button" className="icon-button" onClick={onRedo} disabled={!canRedo}>
  <Redo2 aria-hidden="true" size={18} />
  다시 실행
</button>
<button type="button" className="icon-button danger-button" onClick={onClear}>
  <RotateCcw aria-hidden="true" size={18} />
  {clearPending ? '전체 지우기 확인' : '전체 지우기'}
</button>
```

In `App`, keep `clearPending` state. First click arms clear, second click increments `clearSignal`.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
npm test -- src/App.test.tsx
npm test -- src/domain/symmetry.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/components/CanvasStage.tsx src/components/StudioToolbar.tsx src/App.tsx src/App.test.tsx src/test/setup.ts
git commit -m "feat: harden canvas recovery controls"
```

---

### Task 2: Classroom Mission Flow and Accessible Controls

**Files:**
- Modify: `src/components/StudioToolbar.tsx`
- Modify: `src/components/LearningPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Test: `npm test -- src/App.test.tsx`

- [ ] **Step 1: Write failing tests for mission flow and control semantics**

Add tests in `src/App.test.tsx`:

```tsx
it('uses a radiogroup for exclusive symmetry axis selection', () => {
  render(<App />);

  expect(screen.getByRole('radiogroup', { name: '대칭축 선택' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: '세로 대칭축' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('radio', { name: '가로 대칭축' })).toHaveAttribute('aria-checked', 'false');
});

it('updates classroom mission checklist as axes are explored', async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText('세로축으로 시작 선 그리기')).toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: '가로 대칭축' }));
  await user.click(screen.getByRole('radio', { name: '대각선 대칭축' }));

  expect(screen.getByRole('status')).toHaveTextContent('대각선 대칭축');
  expect(screen.getByText('세 축 비교하기')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because toolbar still uses grouped pressed buttons and mission checklist does not exist.

- [ ] **Step 3: Convert axis buttons to radiogroup semantics**

In `StudioToolbar`, change axis group to:

```tsx
<div className="segmented-control" role="radiogroup" aria-label="대칭축 선택">
  {axisOrder.map((axisMode) => (
    <button
      key={axisMode}
      type="button"
      role="radio"
      aria-checked={axis === axisMode}
      className="segment-button"
      onClick={() => onAxisChange(axisMode)}
    >
      {axisLabels[axisMode]}
    </button>
  ))}
</div>
```

Keep visual selected style by updating CSS selector from `[aria-pressed='true']` to `[aria-checked='true']` for `.segment-button`.

- [ ] **Step 4: Add visual color labels without crowding the toolbar**

Inside each swatch button:

```tsx
<span className="swatch-label">{swatch.name}</span>
```

Add CSS:

```css
.color-swatch {
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.swatch-label {
  pointer-events: none;
}
```

- [ ] **Step 5: Add mission checklist**

In `App`, track visited axes:

```ts
const [visitedAxes, setVisitedAxes] = useState<AxisMode[]>(['vertical']);
```

On axis change:

```ts
setVisitedAxes((current) =>
  current.includes(nextAxis) ? current : [...current, nextAxis],
);
```

Pass `visitedAxes` to `LearningPanel`.

In `LearningPanel`, render:

```tsx
const missions = [
  { id: 'vertical', label: '세로축으로 시작 선 그리기', complete: visitedAxes.includes('vertical') },
  { id: 'horizontal', label: '가로축으로 위아래 반사 비교하기', complete: visitedAxes.includes('horizontal') },
  { id: 'diagonal', label: '대각선축으로 방향 변화 관찰하기', complete: visitedAxes.includes('diagonal') },
  { id: 'compare', label: '세 축 비교하기', complete: visitedAxes.length === 3 },
];
```

Show each as a compact checklist item with `aria-label` that includes 완료/진행 중.

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected: PASS.

Commit:

```bash
git add src/components/StudioToolbar.tsx src/components/LearningPanel.tsx src/App.tsx src/styles.css src/App.test.tsx
git commit -m "feat: add classroom mission flow"
```

---

### Task 3: QA, Deployment Smoke, and Repository Hygiene

**Files:**
- Create: `scripts/verify-pages.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`
- Modify: `.gitignore`
- Modify: `tests/symmetry-art-studio.spec.ts`
- Test: `npm test`, `npm run lint`, `npm run build`, `npm run e2e`

- [ ] **Step 1: Write a live page verification script**

Create `scripts/verify-pages.mjs`:

```js
const pageUrl = process.argv[2] ?? 'https://wbmaker2.github.io/symmetry-art-studio/';

const response = await fetch(pageUrl);
if (!response.ok) {
  throw new Error(`Expected ${pageUrl} to return 200, got ${response.status}`);
}

const html = await response.text();
if (!html.includes('마법의 데칼코마니: 대칭 아트 스튜디오')) {
  throw new Error('Live HTML did not contain the app title.');
}

const assetMatches = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
if (assetMatches.length === 0) {
  throw new Error('Live HTML did not reference JS/CSS assets.');
}

for (const assetPath of assetMatches) {
  const assetUrl = new URL(assetPath, pageUrl).toString();
  const assetResponse = await fetch(assetUrl);
  if (!assetResponse.ok) {
    throw new Error(`Expected asset ${assetUrl} to return 200, got ${assetResponse.status}`);
  }
}

console.log(`Verified ${pageUrl} with ${assetMatches.length} assets.`);
```

- [ ] **Step 2: Add package scripts**

In `package.json`, keep backward compatibility but clarify type checking:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b",
  "lint": "npm run typecheck",
  "test": "vitest run",
  "test:watch": "vitest",
  "preview": "vite preview",
  "e2e": "playwright test",
  "verify:pages": "node scripts/verify-pages.mjs"
}
```

- [ ] **Step 3: Improve E2E to check drawing pixels**

In `tests/symmetry-art-studio.spec.ts`, after drawing a stroke, sample the canvas:

```ts
const pixelCheck = await canvas.evaluate((element) => {
  const target = element as HTMLCanvasElement;
  const ctx = target.getContext('2d');
  if (!ctx) return { originalAlpha: 0, reflectedAlpha: 0 };
  const original = ctx.getImageData(240, 384, 1, 1).data;
  const reflected = ctx.getImageData(720, 384, 1, 1).data;
  return {
    originalAlpha: original[3],
    reflectedAlpha: reflected[3],
  };
});
expect(pixelCheck.originalAlpha).toBeGreaterThan(0);
expect(pixelCheck.reflectedAlpha).toBeGreaterThan(0);
```

Use canvas coordinate conversion based on the same percentages used for dispatching pointer events.

- [ ] **Step 4: Update GitHub Actions**

In `.github/workflows/deploy-pages.yml`, after `npm run build`, add:

```yaml
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run browser tests
        run: npm run e2e
```

After deployment, add:

```yaml
      - name: Verify live Pages site
        run: npm run verify:pages -- "${{ steps.deployment.outputs.page_url }}"
```

- [ ] **Step 5: Update docs and ignore generated verification screenshots**

Add to `.gitignore`:

```gitignore
*-public-card.png
```

Update `README.md` with:

```md
## 공개 URL

https://wbmaker2.github.io/symmetry-art-studio/

## 배포 검증

```bash
npm run verify:pages
```
```

Mention that `npm run lint` currently delegates to TypeScript type checking.

- [ ] **Step 6: Run full verification and commit**

Run:

```bash
npm test
npm run lint
npm run build
npm run e2e
npm run verify:pages
```

Expected: all commands PASS.

Commit:

```bash
git add scripts/verify-pages.mjs package.json .github/workflows/deploy-pages.yml README.md .gitignore tests/symmetry-art-studio.spec.ts
git commit -m "ci: strengthen deployment verification"
```

---

## Final Verification

After all tasks:

```bash
npm test
npm run lint
npm run build
npm run e2e
npm run verify:pages
git status --short
```

Expected:
- unit tests pass
- type check passes
- production build succeeds
- Playwright desktop/mobile flow passes
- published Pages URL returns title and JS/CSS assets
- no tracked unintended artifacts; `symmetry-art-studio-public-card.png` is ignored

## Self-Review

- Spec coverage: addresses P1 input accessibility/recovery risk through active pointer, undo/redo, clear confirmation; P2 learning flow through mission checklist; P1/P2 QA risk through E2E and Pages smoke.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: `AxisMode`, `DrawingTool`, request signal props, and `visitedAxes` names are consistent across tasks.
