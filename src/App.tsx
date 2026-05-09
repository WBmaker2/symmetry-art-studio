import { useCallback, useMemo, useState } from 'react';

import CanvasStage from './components/CanvasStage';
import {
  StudioToolbar,
  type ColorSwatch,
  type DrawingTool,
} from './components/StudioToolbar';
import { LearningPanel } from './components/LearningPanel';
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
  const [undoSignal, setUndoSignal] = useState(0);
  const [redoSignal, setRedoSignal] = useState(0);
  const [saveSignal, setSaveSignal] = useState(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [clearPending, setClearPending] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [visitedAxes, setVisitedAxes] = useState<AxisMode[]>(['vertical']);
  const [activityMessage, setActivityMessage] = useState(
    '세로 대칭축을 기준으로 시작해 보세요.',
  );

  const handleSave = useCallback(() => {
    setSaveSignal((value) => value + 1);
  }, []);

  const onAxisChange = useCallback((nextAxis: AxisMode) => {
    setClearPending(false);
    setVisitedAxes((prevVisitedAxes) =>
      prevVisitedAxes.includes(nextAxis)
        ? prevVisitedAxes
        : [...prevVisitedAxes, nextAxis],
    );
    setAxis(nextAxis);
    setActivityMessage(`${axisLabels[nextAxis]}으로 바꾸었습니다.`);
  }, []);

  const onClear = useCallback(() => {
    if (!clearPending) {
      setClearPending(true);
      setActivityMessage('한 번 더 누르면 캔버스를 비웁니다');
      return;
    }

    setClearSignal((value) => value + 1);
    setClearPending(false);
  }, [clearPending]);

  const onUndo = useCallback(() => {
    setUndoSignal((value) => value + 1);
  }, []);

  const onRedo = useCallback(() => {
    setRedoSignal((value) => value + 1);
  }, []);

  const onHistoryChange = useCallback(
    ({
      canUndo: nextUndoEnabled,
      canRedo: nextRedoEnabled,
    }: {
      canUndo: boolean;
      canRedo: boolean;
    }) => {
      setCanUndo(nextUndoEnabled);
      setCanRedo(nextRedoEnabled);
    },
    [],
  );

  const handleClearComplete = useCallback(() => {
    setClearPending(false);
    setActivityMessage('캔버스를 비웠습니다.');
  }, []);

  const onUndoComplete = useCallback((message: string) => {
    setActivityMessage(message);
    setClearPending(false);
  }, []);

  const onRedoComplete = useCallback((message: string) => {
    setActivityMessage(message);
    setClearPending(false);
  }, []);

  const onSaveComplete = useCallback((message: string) => {
    setActivityMessage(message);
    setClearPending(false);
  }, []);

  const onColorChange = useCallback((nextColor: string) => {
    setClearPending(false);
    setColor(nextColor);
  }, []);

  const onBrushSizeChange = useCallback((nextBrushSize: number) => {
    setClearPending(false);
    setBrushSize(nextBrushSize);
  }, []);

  const onToolChange = useCallback((nextTool: DrawingTool) => {
    setClearPending(false);
    setTool(nextTool);
  }, []);

  const onStrokeChange = useCallback((message: string) => {
    setClearPending(false);
    setActivityMessage(message);
  }, []);

  const statusText = useMemo(
    () => `${axisLabels[axis]} 선택됨. ${activityMessage}`,
    [axis, activityMessage],
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
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          clearPending={clearPending}
          colors={colors}
          onAxisChange={onAxisChange}
          onColorChange={onColorChange}
          onBrushSizeChange={onBrushSizeChange}
          onToolChange={onToolChange}
          onClear={onClear}
          onSave={handleSave}
        />
        <CanvasStage
          axis={axis}
          color={color}
          brushSize={brushSize}
          tool={tool}
          undoSignal={undoSignal}
          redoSignal={redoSignal}
          saveSignal={saveSignal}
          clearSignal={clearSignal}
          onUndoComplete={onUndoComplete}
          onRedoComplete={onRedoComplete}
          onSaveComplete={onSaveComplete}
          onClearComplete={handleClearComplete}
          onStrokeChange={onStrokeChange}
          onHistoryChange={onHistoryChange}
        />
        <LearningPanel
          activityMessage={activityMessage}
          visitedAxes={visitedAxes}
        />
      </section>

      <p className="sr-status" role="status" aria-live="polite">
        {statusText}
      </p>
    </main>
  );
}
