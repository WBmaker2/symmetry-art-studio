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
  undoSignal: number;
  redoSignal: number;
  saveSignal: number;
  clearSignal: number;
  onUndoComplete: (message: string) => void;
  onRedoComplete: (message: string) => void;
  onSaveComplete: (message: string) => void;
  onClearComplete: () => void;
  onStrokeChange: (message: string) => void;
  onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
};

type StrokeSegment = {
  start: Point;
  end: Point;
  axis: AxisMode;
  color: string;
  brushSize: number;
  tool: DrawingTool;
};

type Stroke = {
  id: number;
  segments: StrokeSegment[];
};

const canvasSize: CanvasSize = {
  width: 960,
  height: 960,
};

export default function CanvasStage({
  axis,
  color,
  brushSize,
  tool,
  undoSignal,
  redoSignal,
  saveSignal,
  clearSignal,
  onUndoComplete,
  onRedoComplete,
  onSaveComplete,
  onClearComplete,
  onStrokeChange,
  onHistoryChange,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const strokeIdRef = useRef(0);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const undoneStrokesRef = useRef<Stroke[]>([]);
  const clearSignalRef = useRef(clearSignal);
  const undoSignalRef = useRef(undoSignal);
  const redoSignalRef = useRef(redoSignal);
  const saveSignalRef = useRef(saveSignal);

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

    for (const stroke of strokesRef.current) {
      for (const segment of stroke.segments) {
        drawSegment(ctx, segment);
      }
    }

    drawAxis(ctx);
  }, [drawAxis, drawSegment]);

  const reportHistory = useCallback(() => {
    onHistoryChange({
      canUndo: strokesRef.current.length > 0,
      canRedo: undoneStrokesRef.current.length > 0,
    });
  }, [onHistoryChange]);

  const commitActiveStroke = useCallback(() => {
    if (!activeStrokeRef.current || activeStrokeRef.current.segments.length === 0) {
      return;
    }

    strokesRef.current.push(activeStrokeRef.current);
    activeStrokeRef.current = null;
    undoneStrokesRef.current = [];
  }, []);

  const undoLastStroke = useCallback(() => {
    const stroke = strokesRef.current.pop();
    if (!stroke) {
      return '되돌릴 획이 없습니다.';
    }

    undoneStrokesRef.current.push(stroke);
    redraw();
    reportHistory();
    return '마지막 획을 되돌렸습니다.';
  }, [redraw, reportHistory]);

  const redoLastStroke = useCallback(() => {
    const stroke = undoneStrokesRef.current.pop();
    if (!stroke) {
      return '다시 실행할 획이 없습니다.';
    }

    strokesRef.current.push(stroke);
    redraw();
    reportHistory();
    return '되돌린 획을 다시 그렸습니다.';
  }, [redraw, reportHistory]);

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
    reportHistory();
    redraw();
  }, [axis, redraw, reportHistory]);

  useEffect(() => {
    if (clearSignalRef.current === clearSignal) {
      return;
    }

    clearSignalRef.current = clearSignal;
    strokesRef.current = [];
    undoneStrokesRef.current = [];
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    redraw();
    reportHistory();
    onClearComplete();
  }, [clearSignal, onClearComplete, redraw, reportHistory]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (activePointerIdRef.current !== null) {
        return;
      }

      const point = getCanvasPoint(event);
      activePointerIdRef.current = event.pointerId;
      activeStrokeRef.current = {
        id: strokeIdRef.current++,
        segments: [],
      };
      isDrawingRef.current = true;
      lastPointRef.current = point;
      onStrokeChange(
        '그리기를 시작했습니다. 반대편에 대칭 그림이 함께 나타납니다.',
      );

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Pointer capture can fail in some environments; drawing still works.
      }
    },
    [getCanvasPoint, onStrokeChange],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (
        !isDrawingRef.current ||
        activePointerIdRef.current !== event.pointerId ||
        !activeStrokeRef.current
      ) {
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
      activeStrokeRef.current.segments.push(segment);
      drawSegment(ctx, segment);
      drawAxis(ctx);
      lastPointRef.current = currentPoint;
    },
    [axis, brushSize, color, drawAxis, drawSegment, getCanvasPoint, tool],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (
        !isDrawingRef.current ||
        activePointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_error) {
        // Ignore environments where pointer capture was never acquired.
      }

      isDrawingRef.current = false;
      activePointerIdRef.current = null;
      lastPointRef.current = null;
      commitActiveStroke();
      reportHistory();
      onStrokeChange(
        '획을 완성했습니다. 대칭축을 바꾸면 새 축으로 이어서 그릴 수 있습니다.',
      );
    },
    [commitActiveStroke, onStrokeChange, reportHistory],
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
    onSaveComplete('PNG 이미지로 저장했습니다.');
  }, [onSaveComplete]);

  useEffect(() => {
    if (saveSignalRef.current === saveSignal) {
      return;
    }

    saveSignalRef.current = saveSignal;
    savePng();
  }, [saveSignal, savePng]);

  useEffect(() => {
    if (undoSignalRef.current === undoSignal) {
      return;
    }

    undoSignalRef.current = undoSignal;
    const message = undoLastStroke();
    onUndoComplete(message);
  }, [undoSignal, onUndoComplete, undoLastStroke]);

  useEffect(() => {
    if (redoSignalRef.current === redoSignal) {
      return;
    }

    redoSignalRef.current = redoSignal;
    const message = redoLastStroke();
    onRedoComplete(message);
  }, [redoSignal, onRedoComplete, redoLastStroke]);

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
