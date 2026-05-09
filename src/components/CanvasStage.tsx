import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  getAxisLine,
  axisLabels,
  getSymmetryPointGuide,
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
  showGrid: boolean;
  pointMode: boolean;
  distanceHints: boolean;
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
  now?: () => Date;
};

type StrokeSegment = {
  start: Point;
  end: Point;
  axis: AxisMode;
  color: string;
  brushSize: number;
  tool: DrawingTool;
};

type StrokeAction = {
  id: number;
  kind: 'stroke';
  segments: StrokeSegment[];
};

type PointAction = {
  id: number;
  kind: 'point';
  point: Point;
  reflectedPoint: Point;
  axis: AxisMode;
  color: string;
  brushSize: number;
};

type CanvasAction = StrokeAction | PointAction;

const canvasSize: CanvasSize = {
  width: 960,
  height: 960,
};

const gridSpacing = 40;
const cardPadding = 28;
const titleHeight = 64;

function to2Digits(value: number): string {
  return String(value).padStart(2, '0');
}

function formatExportDate(now: Date): string {
  return `${now.getFullYear()}-${to2Digits(now.getMonth() + 1)}-${to2Digits(
    now.getDate(),
  )}`;
}

function getPointLabel(index: number): string {
  const letterCode = 'A'.charCodeAt(0) + (index % 26);
  return String.fromCharCode(letterCode);
}

function drawPointGuideLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
): void {
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '14px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  if (typeof ctx.fillText === 'function') {
    ctx.fillText(text, x, y - 8);
  }
  ctx.restore();
}

export default function CanvasStage({
  axis,
  color,
  brushSize,
  tool,
  showGrid,
  pointMode,
  distanceHints,
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
  now = () => new Date(),
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const actionIdRef = useRef(0);
  const activeStrokeRef = useRef<StrokeAction | null>(null);
  const actionsRef = useRef<CanvasAction[]>([]);
  const undoneActionsRef = useRef<CanvasAction[]>([]);
  const artworkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const artworkContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const clearSignalRef = useRef(clearSignal);
  const undoSignalRef = useRef(undoSignal);
  const redoSignalRef = useRef(redoSignal);
  const saveSignalRef = useRef(saveSignal);

  const shouldShowDistanceGuides = pointMode && distanceHints;

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!showGrid) {
        return;
      }

      ctx.save();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      for (let x = 0; x <= canvasSize.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvasSize.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }

      ctx.restore();
    },
    [showGrid],
  );

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
      const reflectedStart = getSymmetryPointGuide(segment.start, segment.axis, canvasSize).reflected;
      const reflectedEnd = getSymmetryPointGuide(segment.end, segment.axis, canvasSize).reflected;
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

  const drawPointAction = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      action: PointAction,
      label: string,
      showDistanceGuides: boolean,
    ) => {
      const guide = getSymmetryPointGuide(action.point, action.axis, canvasSize);
      const dotSize = Math.max(4, Math.max(2, action.brushSize * 0.34));

      ctx.save();
      if (typeof ctx.arc === 'function' && typeof ctx.fill === 'function') {
        ctx.beginPath();
        ctx.fillStyle = action.color;
        ctx.arc(action.point.x, action.point.y, dotSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#0f766e';
        ctx.arc(guide.reflected.x, guide.reflected.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      drawPointGuideLabel(ctx, action.point.x, action.point.y, `${label}`);
      drawPointGuideLabel(ctx, guide.reflected.x, guide.reflected.y, `${label}'`);
      ctx.restore();

      if (!showDistanceGuides) {
        return;
      }

      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f766e';

      ctx.beginPath();
      ctx.moveTo(action.point.x, action.point.y);
      ctx.lineTo(guide.footPoint.x, guide.footPoint.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(guide.reflected.x, guide.reflected.y);
      ctx.lineTo(guide.footPoint.x, guide.footPoint.y);
      ctx.stroke();
      ctx.restore();

      if (typeof ctx.fillText === 'function') {
        ctx.save();
        ctx.fillStyle = guide.sameDistance ? '#065f46' : '#b45309';
        ctx.font =
          '12px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const footLabelX = guide.footPoint.x + 8;
        const footLabelY = guide.footPoint.y + 8;
        ctx.fillText(
          `d=${Math.round(guide.originalDistance)}`,
          footLabelX,
          footLabelY,
        );
        ctx.restore();
      }
    },
    [],
  );

  const getArtworkCanvas = useCallback(
    (ownerDocument: Document, width: number, height: number) => {
      if (!artworkCanvasRef.current) {
        const createdCanvas = ownerDocument.createElement('canvas');
        artworkCanvasRef.current = createdCanvas;
        artworkContextRef.current = createdCanvas.getContext('2d');
      }

      const artworkCanvas = artworkCanvasRef.current;
      if (!artworkCanvas) {
        return null;
      }

      if (artworkCanvas.width !== width || artworkCanvas.height !== height) {
        artworkCanvas.width = width;
        artworkCanvas.height = height;
      }

      if (!artworkContextRef.current) {
        artworkContextRef.current = artworkCanvas.getContext('2d');
      }

      return artworkCanvas;
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

    const actionsWithActive: CanvasAction[] = activeStrokeRef.current
      ? [...actionsRef.current, activeStrokeRef.current]
      : actionsRef.current;
    const artworkCanvas = getArtworkCanvas(canvas.ownerDocument, canvas.width, canvas.height);
    const artworkCtx = artworkContextRef.current;

    if (artworkCtx) {
      artworkCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const drawArtworkAction = (
      layerCtx: CanvasRenderingContext2D,
      action: CanvasAction,
    ) => {
      if (action.kind === 'stroke') {
        for (const segment of action.segments) {
          drawSegment(layerCtx, segment);
        }
      }
    };

    const drawPointActionLayer = (action: CanvasAction, actionIndex: number) => {
      if (action.kind === 'point') {
        const pointIndex = actionsWithActive
          .slice(0, actionIndex)
          .reduce((acc, prevAction) => acc + Number(prevAction.kind === 'point'), 0);
        drawPointAction(ctx, action, getPointLabel(pointIndex), shouldShowDistanceGuides);
      }
    };

    drawGrid(ctx);

    if (artworkCtx && artworkCanvas) {
      actionsWithActive.forEach((action) => drawArtworkAction(artworkCtx, action));
      ctx.drawImage(artworkCanvas, 0, 0);
    }

    actionsWithActive.forEach(drawPointActionLayer);
    drawAxis(ctx);
  }, [drawAxis, drawGrid, drawSegment, drawPointAction, getArtworkCanvas, shouldShowDistanceGuides]);

  const reportHistory = useCallback(() => {
    onHistoryChange({
      canUndo: actionsRef.current.length > 0,
      canRedo: undoneActionsRef.current.length > 0,
    });
  }, [onHistoryChange]);

  const commitActiveStroke = useCallback(() => {
    if (!activeStrokeRef.current) {
      return;
    }

    if (activeStrokeRef.current.segments.length > 0) {
      actionsRef.current.push(activeStrokeRef.current);
      undoneActionsRef.current = [];
    }

    activeStrokeRef.current = null;
  }, []);

  const undoLastAction = useCallback(() => {
    const action = actionsRef.current.pop();
    if (!action) {
      return '되돌릴 획이 없습니다.';
    }

    undoneActionsRef.current.push(action);
    redraw();
    reportHistory();
    return '마지막 획을 되돌렸습니다.';
  }, [redraw, reportHistory]);

  const redoLastAction = useCallback(() => {
    const action = undoneActionsRef.current.pop();
    if (!action) {
      return '다시 실행할 획이 없습니다.';
    }

    actionsRef.current.push(action);
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
  }, [axis, pointMode, distanceHints, showGrid, redraw, reportHistory]);

  useEffect(() => {
    if (clearSignalRef.current === clearSignal) {
      return;
    }

    clearSignalRef.current = clearSignal;
    actionsRef.current = [];
    undoneActionsRef.current = [];
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

      if (pointMode) {
        const reflectedPoint = getSymmetryPointGuide(point, axis, canvasSize).reflected;

        actionsRef.current.push({
          id: actionIdRef.current++,
          kind: 'point',
          point,
          reflectedPoint,
          axis,
          color,
          brushSize,
        });
        undoneActionsRef.current = [];
        redraw();
        reportHistory();
        onStrokeChange(
          '원본점과 대칭점은 대칭축에서 같은 거리에 있습니다.',
        );
        isDrawingRef.current = false;
        activePointerIdRef.current = null;
        return;
      }

      activeStrokeRef.current = {
        id: actionIdRef.current++,
        kind: 'stroke',
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
    [brushSize, color, getCanvasPoint, onStrokeChange, pointMode, redraw, reportHistory, axis],
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
      const startPoint = lastPointRef.current;

      if (!startPoint) {
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
      redraw();
      lastPointRef.current = currentPoint;
    },
    [
      axis,
      brushSize,
      color,
      getCanvasPoint,
      redraw,
      tool,
    ],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || activePointerIdRef.current !== event.pointerId) {
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
      redraw();
      reportHistory();
      onStrokeChange(
        '획을 완성했습니다. 대칭축을 바꾸면 새 축으로 이어서 그릴 수 있습니다.',
      );
    },
    [commitActiveStroke, onStrokeChange, redraw, reportHistory],
  );

  const savePng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    redraw();
    const exportCanvas = canvas.ownerDocument.createElement('canvas');
    exportCanvas.width = canvas.width + cardPadding * 2;
    exportCanvas.height = canvas.height + cardPadding * 2 + titleHeight;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) {
      onSaveComplete('작품 카드를 저장하지 못했습니다.');
      return;
    }

    const exportDate = formatExportDate(now());

    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    exportCtx.fillStyle = '#0f172a';
    exportCtx.textAlign = 'center';
    exportCtx.textBaseline = 'top';
    exportCtx.font =
      'bold 30px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    exportCtx.fillText(
      '마법의 데칼코마니: 대칭 아트 스튜디오',
      exportCanvas.width / 2,
      16,
    );

    exportCtx.fillStyle = '#334155';
    exportCtx.font =
      '14px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    exportCtx.textAlign = 'left';
    exportCtx.fillText(`${axisLabels[axis]} / Symmetry Art Studio`, cardPadding, 56);
    exportCtx.textAlign = 'right';
    exportCtx.fillText(exportDate, exportCanvas.width - cardPadding, 56);

    exportCtx.drawImage(canvas, cardPadding, titleHeight + 10);
    exportCtx.strokeStyle = '#e2e8f0';
    exportCtx.lineWidth = 2;
    exportCtx.strokeRect(cardPadding, titleHeight + 10, canvas.width, canvas.height);

    exportCtx.strokeStyle = '#94a3b8';
    exportCtx.setLineDash([6, 5]);
    exportCtx.beginPath();
    exportCtx.moveTo(cardPadding, titleHeight + 4);
    exportCtx.lineTo(exportCanvas.width - cardPadding, titleHeight + 4);
    exportCtx.stroke();
    exportCtx.setLineDash([]);

    exportCtx.textAlign = 'left';
    exportCtx.fillStyle = '#0f172a';
    exportCtx.font =
      '12px Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    exportCtx.fillText('Symmetry Art Studio', cardPadding, exportCanvas.height - cardPadding);

    const link = canvas.ownerDocument.createElement('a');
    link.download = `symmetry-art-studio-${exportDate}-${axis}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    onSaveComplete(`${axisLabels[axis]} 작품 카드를 저장했습니다.`);
  }, [axis, onSaveComplete, redraw, now]);

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
    const message = undoLastAction();
    onUndoComplete(message);
  }, [undoSignal, onUndoComplete, undoLastAction]);

  useEffect(() => {
    if (redoSignalRef.current === redoSignal) {
      return;
    }

    redoSignalRef.current = redoSignal;
    const message = redoLastAction();
    onRedoComplete(message);
  }, [redoSignal, onRedoComplete, redoLastAction]);

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
