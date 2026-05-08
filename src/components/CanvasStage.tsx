import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  getAxisLine,
  reflectPoint,
  type AxisMode,
  type CanvasSize,
  type Point,
} from '../domain/symmetry';
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
  start: Point;
  end: Point;
  axis: AxisMode;
  color: string;
  brushSize: number;
  tool: DrawingTool;
};

const canvasSize: CanvasSize = {
  width: 1200,
  height: 760,
};

export default function CanvasStage({
  axis,
  color,
  brushSize,
  tool,
  clearSignal,
  onClearComplete,
  onStrokeChange,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const strokeSegmentsRef = useRef<StrokeSegment[]>([]);
  const clearSignalRef = useRef(clearSignal);

  const drawAxis = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const axisLine = getAxisLine(axis, canvasSize);
      ctx.save();
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(axisLine.start.x, axisLine.start.y);
      ctx.lineTo(axisLine.end.x, axisLine.end.y);
      ctx.stroke();
      ctx.restore();
    },
    [axis],
  );

  const drawSegment = useCallback(
    (ctx: CanvasRenderingContext2D, segment: StrokeSegment) => {
      const reflectedStart = reflectPoint(segment.start, segment.axis, canvasSize);
      const reflectedEnd = reflectPoint(segment.end, segment.axis, canvasSize);
      const pairs: Array<[Point, Point]> = [
        [segment.start, segment.end],
        [reflectedStart, reflectedEnd],
      ];

      const isEraser = segment.tool === 'eraser';
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = isEraser ? segment.brushSize * 1.35 : segment.brushSize;
      ctx.globalCompositeOperation = isEraser
        ? 'destination-out'
        : 'source-over';
      ctx.strokeStyle = isEraser ? '#000000' : segment.color;

      for (const [startPoint, endPoint] of pairs) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }

      ctx.restore();
    },
    [],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const segment of strokeSegmentsRef.current) {
      drawSegment(ctx, segment);
    }

    drawAxis(ctx);
  }, [drawAxis, drawSegment]);

  const getCanvasPoint = useCallback(
    (event: PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rect = canvas.getBoundingClientRect();
      const ratioX = canvas.width / rect.width;
      const ratioY = canvas.height / rect.height;
      return {
        x: (event.clientX - rect.left) * ratioX,
        y: (event.clientY - rect.top) * ratioY,
      };
    },
    [],
  );

  useEffect(() => {
    redraw();
  }, [axis, redraw]);

  useEffect(() => {
    if (clearSignalRef.current === clearSignal) {
      return;
    }

    clearSignalRef.current = clearSignal;
    strokeSegmentsRef.current = [];
    redraw();
    onClearComplete();
  }, [clearSignal, onClearComplete, redraw]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(event);
      isDrawingRef.current = true;
      lastPointRef.current = point;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Pointer capture can fail in some environments; drawing still works.
      }
      onStrokeChange(
        '그리기를 시작했습니다. 반대편에 대칭 그림이 함께 나타납니다.',
      );
    },
    [getCanvasPoint, onStrokeChange],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) {
        return;
      }

      const currentPoint = getCanvasPoint(event);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const startPoint = lastPointRef.current;

      if (!ctx || !startPoint) {
        return;
      }

      const segment: StrokeSegment = {
        start: startPoint,
        end: currentPoint,
        axis,
        color,
        brushSize,
        tool,
      };
      strokeSegmentsRef.current.push(segment);
      drawSegment(ctx, segment);
      drawAxis(ctx);
      lastPointRef.current = currentPoint;
    },
    [axis, brushSize, color, drawAxis, drawSegment, getCanvasPoint, tool],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_error) {
        // Ignore environments where pointer capture was never acquired.
      }

      isDrawingRef.current = false;
      lastPointRef.current = null;
      onStrokeChange(
        '획을 완성했습니다. 대칭축을 바꾸면 새 축으로 이어서 그릴 수 있습니다.',
      );
    },
    [onStrokeChange],
  );

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
    const handleSaveRequest = () => {
      savePng();
    };
    window.addEventListener('symmetry-art-save-request', handleSaveRequest);
    return () => {
      window.removeEventListener('symmetry-art-save-request', handleSaveRequest);
    };
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
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
