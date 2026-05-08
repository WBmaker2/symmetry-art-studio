import {
  Brush,
  Download,
  Eraser,
  RotateCcw,
  Slash,
} from 'lucide-react';

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
  onBrushSizeChange: (brushSize: number) => void;
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  onSave: () => void;
};

const axisOrder: AxisMode[] = ['vertical', 'horizontal', 'diagonal'];

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
    <aside className="studio-toolbar">
      <section className="toolbar-group">
        <h2>대칭축</h2>
        <div className="axis-buttons" role="group" aria-label="대칭축 선택">
          {axisOrder.map((axisMode) => (
            <button
              key={axisMode}
              type="button"
              onClick={() => onAxisChange(axisMode)}
              aria-pressed={axis === axisMode}
              className={`toggle-btn ${axis === axisMode ? 'is-active' : ''}`}
            >
              {axisMode === 'diagonal' && Slash ? <Slash /> : null}
              {axisLabels[axisMode]}
            </button>
          ))}
        </div>
      </section>

      <section className="toolbar-group">
        <h2>붓 도구</h2>
        <div className="tool-row">
          <button
            type="button"
            className={`tool-btn ${tool === 'brush' ? 'is-active' : ''}`}
            aria-pressed={tool === 'brush'}
            onClick={() => onToolChange('brush')}
          >
            <Brush />
            붓
          </button>
          {colors.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              className={`swatch-btn ${
                tool === 'brush' && color === swatch.value ? 'is-active' : ''
              }`}
              aria-label={swatch.name}
              aria-pressed={tool === 'brush' && color === swatch.value}
              onClick={() => {
                onColorChange(swatch.value);
                onToolChange('brush');
              }}
              style={{ background: swatch.value }}
            />
          ))}
        </div>
      </section>

      <section className="toolbar-group">
        <label htmlFor="brush-size">펜 굵기</label>
        <input
          id="brush-size"
          type="range"
          min={1}
          max={30}
          value={brushSize}
          onChange={(event) => onBrushSizeChange(Number(event.target.value))}
          aria-label="펜 굵기"
        />
      </section>

      <section className="toolbar-group">
        <div className="action-row">
          <button
            type="button"
            className={`action-btn ${tool === 'eraser' ? 'is-active' : ''}`}
            onClick={() => onToolChange('eraser')}
            aria-pressed={tool === 'eraser'}
          >
            <Eraser />
            지우개
          </button>
          <button type="button" className="action-btn" onClick={onClear}>
            <RotateCcw />
            전체 지우기
          </button>
          <button type="button" className="action-btn" onClick={onSave}>
            <Download />
            PNG 저장
          </button>
        </div>
      </section>
      <p className="axis-note">
        선택한 축을 기준으로 같은 길이와 방향 관계가 반사됩니다.
      </p>
    </aside>
  );
}
