import { useCallback, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { SwipeDirection } from '../types';

function directionOf(dx: number, dy: number): SwipeDirection {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export function useSwipeGesture(onSwipe: (dir: SwipeDirection) => void, threshold = 90) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    if (!start.current) return;
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  }, []);

  const finish = useCallback(
    (e: PointerEvent<HTMLElement>, cancelled: boolean) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      setDragging(false);
      setOffset({ x: 0, y: 0 });
      if (!cancelled && Math.max(Math.abs(dx), Math.abs(dy)) > threshold) {
        onSwipe(directionOf(dx, dy));
      }
    },
    [onSwipe, threshold],
  );

  const reached = Math.max(Math.abs(offset.x), Math.abs(offset.y)) > threshold;
  const activeDir = dragging && reached ? directionOf(offset.x, offset.y) : null;

  return {
    offset,
    dragging,
    activeDir,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: PointerEvent<HTMLElement>) => finish(e, false),
      onPointerCancel: (e: PointerEvent<HTMLElement>) => finish(e, true),
    },
  };
}
