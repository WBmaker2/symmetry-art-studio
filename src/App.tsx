import { useMemo, useState } from 'react';

import {
  StudioToolbar,
  type ColorSwatch,
  type DrawingTool,
} from './components/StudioToolbar';
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
