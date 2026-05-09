import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { canvasContext, resetCanvasMocks, toDataURLMock } from './test/setup';

beforeEach(() => {
  resetCanvasMocks();
});

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

  it('renders the drawing canvas and clear command', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByLabelText('대칭 그림 캔버스')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '전체 지우기' }));
    expect(screen.getByRole('status')).toHaveTextContent('한 번 더 누르면 캔버스를 비웁니다');

    await user.click(screen.getByRole('button', { name: '전체 지우기 확인' }));
    expect(screen.getByRole('status')).toHaveTextContent('캔버스를 비웠습니다');
  });

  it('requires clear confirmation and supports undo/redo for one stroke', async () => {
    const user = userEvent.setup();
    render(<App />);

    const canvas = screen.getByLabelText('대칭 그림 캔버스');
    fireEvent.pointerDown(canvas, {
      pointerId: 9,
      clientX: 200,
      clientY: 200,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 9,
      clientX: 280,
      clientY: 240,
    });
    fireEvent.pointerUp(canvas, {
      pointerId: 9,
      clientX: 280,
      clientY: 240,
    });

    const clearRectBeforeUndo = canvasContext.clearRect.mock.calls.length;

    expect(screen.getByRole('button', { name: '되돌리기' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(canvasContext.clearRect).toHaveBeenCalledTimes(clearRectBeforeUndo + 1);
    expect(screen.getByRole('status')).toHaveTextContent(
      '마지막 획을 되돌렸습니다',
    );

    const lineToBeforeRedo = canvasContext.lineTo.mock.calls.length;
    expect(screen.getByRole('button', { name: '다시 실행' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '다시 실행' }));
    expect(canvasContext.lineTo).toHaveBeenCalled();
    expect(canvasContext.lineTo.mock.calls.length).toBeGreaterThan(
      lineToBeforeRedo,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '되돌린 획을 다시 그렸습니다',
    );
  });

  it('uses a square drawing surface so diagonal symmetry stays visible', () => {
    render(<App />);

    const canvas = screen.getByLabelText('대칭 그림 캔버스') as HTMLCanvasElement;

    expect(canvas.width).toBe(canvas.height);
  });

  it('keeps canvas content on non-clear rerender', async () => {
    const user = userEvent.setup();
    render(<App />);

    const canvas = screen.getByLabelText('대칭 그림 캔버스');
    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      clientX: 300,
      clientY: 360,
    });
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      clientX: 360,
      clientY: 420,
    });
    fireEvent.pointerUp(canvas, {
      pointerId: 1,
      clientX: 360,
      clientY: 420,
    });

    const clearCountBefore = canvasContext.clearRect.mock.calls.length;
    await user.click(screen.getByRole('button', { name: '파랑' }));

    expect(canvasContext.clearRect).toHaveBeenCalledTimes(clearCountBefore);
  });

  it('ignores pointer moves from non-active pointers', () => {
    render(<App />);

    const canvas = screen.getByLabelText('대칭 그림 캔버스');
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 220, clientY: 220 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 700, clientY: 700 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 260, clientY: 260 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 260, clientY: 260 });

    expect(canvasContext.lineTo).not.toHaveBeenCalledWith(700, 700);
    expect(canvasContext.lineTo).toHaveBeenCalledWith(260, 260);
  });

  it('creates a PNG data URL and updates status on save', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'PNG 저장' }));

    expect(toDataURLMock).toHaveBeenCalledWith('image/png');
    expect(screen.getByRole('status')).toHaveTextContent(
      'PNG 이미지로 저장했습니다.',
    );
  });

  it('updates learning panel current work message on axis change', async () => {
    const user = userEvent.setup();
    render(<App />);

    const panel = screen.getByLabelText('수업 관찰 질문');
    await user.click(screen.getByRole('button', { name: '가로 대칭축' }));

    expect(screen.getByRole('status')).toHaveTextContent('가로 대칭축으로 바꾸었습니다.');
    expect(screen.getByText('가로 대칭축으로 바꾸었습니다.')).toBeInTheDocument();
    expect(panel).toHaveTextContent('가로 대칭축으로 바꾸었습니다.');
  });

  it('shows classroom learning prompts tied to symmetry and art standards', () => {
    render(<App />);

    expect(screen.getByText('[6수03-03]')).toBeInTheDocument();
    expect(screen.getByText('[6미02-02]')).toBeInTheDocument();
    expect(screen.getByText('관찰 질문')).toBeInTheDocument();
  });
});
