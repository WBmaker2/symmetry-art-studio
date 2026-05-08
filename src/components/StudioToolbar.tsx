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
    <aside className="toolbar" aria-label="대칭 아트 도구">
      <section
        className="tool-group"
        aria-labelledby="axis-control-title"
      >
        <h2 id="axis-control-title">대칭축</h2>
        <div className="segmented-control" role="group" aria-label="대칭축 선택">
          {axisOrder.map((axisMode) => (
            <button
              key={axisMode}
              type="button"
              onClick={() => onAxisChange(axisMode)}
              aria-pressed={axis === axisMode}
              className="segment-button"
            >
              {axisLabels[axisMode]}
            </button>
          ))}
        </div>
      </section>

      <section
        className="tool-group"
        aria-labelledby="color-control-title"
      >
        <h2 id="color-control-title">색상</h2>
        <div className="swatch-row" role="group" aria-label="색상 선택">
          {colors.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              className="color-swatch"
              aria-label={swatch.name}
              aria-pressed={tool === 'brush' && color === swatch.value}
              onClick={() => {
                onColorChange(swatch.value);
                onToolChange('brush');
              }}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>
      </section>

      <section
        className="tool-group"
        aria-labelledby="brush-size-title"
      >
        <h2 id="brush-size-title">
          <Brush aria-hidden="true" size={18} />
          펜 굵기
        </h2>
        <span>{brushSize}px</span>
        <input
          id="brush-size"
          type="range"
          min={2}
          max={32}
          step={1}
          value={brushSize}
          onChange={(event) => onBrushSizeChange(Number(event.target.value))}
          aria-label="펜 굵기"
        />
      </section>

      <section
        className="tool-group compact-tools"
        aria-label="편집 도구"
      >
        <h2 id="edit-tools-title" className="sr-only">
          편집 도구
        </h2>
        <div className="action-row" aria-labelledby="edit-tools-title">
          <button
            type="button"
            className="icon-button"
            onClick={() => onToolChange(tool === 'eraser' ? 'brush' : 'eraser')}
            aria-pressed={tool === 'eraser'}
            title="지우개"
          >
            <Eraser aria-hidden="true" size={18} />
            지우개
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onClear}
            title="전체 지우기"
          >
            <RotateCcw aria-hidden="true" size={18} />
            전체 지우기
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onSave}
            title="PNG 저장"
          >
            <Download aria-hidden="true" size={18} />
            PNG 저장
          </button>
        </div>
      </section>
      <p className="axis-note">
        <Slash aria-hidden="true" size={16} />
        선택한 축을 기준으로 같은 길이와 방향 관계가 반사됩니다.
      </p>
    </aside>
  );
}
