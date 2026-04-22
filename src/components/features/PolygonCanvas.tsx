import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import type { Point } from '@/types/api';
import { scaleToDisplay, scaleToNatural, type Size } from '@/lib/polygon';

interface Props {
  naturalSize: Size;
  displaySize: Size;
  redPolygon: Point[];
  greenPolygon: Point[];
  activePolygon: 'red' | 'green';
  onChange: (poly: 'red' | 'green', next: Point[]) => void;
  imageSrc: string;
}

const COLORS = {
  red: { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.15)' },
  green: { stroke: '#22C55E', fill: 'rgba(34, 197, 94, 0.15)' },
} as const;

function polygonToPoints(poly: Point[], natural: Size, display: Size): string {
  return poly.map((p) => {
    const d = scaleToDisplay(p, natural, display);
    return `${d.x},${d.y}`;
  }).join(' ');
}

interface Dragging { poly: 'red' | 'green'; idx: number }

export function PolygonCanvas({
  naturalSize, displaySize, redPolygon, greenPolygon, activePolygon, onChange, imageSrc,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<Dragging | null>(null);

  const activePoints = activePolygon === 'red' ? redPolygon : greenPolygon;

  const svgCoords = useCallback((evt: { clientX: number; clientY: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const dx = evt.clientX - rect.left;
    const dy = evt.clientY - rect.top;
    return scaleToNatural({ x: dx, y: dy }, naturalSize, displaySize);
  }, [naturalSize, displaySize]);

  function onSvgClick(e: MouseEvent<SVGSVGElement>) {
    if (dragging) return;
    if ((e.target as Element).tagName === 'circle') return;
    const p = svgCoords(e);
    if (!p) return;
    onChange(activePolygon, [...activePoints, p]);
  }

  function onPointPointerDown(e: PointerEvent<SVGCircleElement>, poly: 'red' | 'green', idx: number) {
    if (e.button === 2) return;
    e.stopPropagation();
    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
    setDragging({ poly, idx });
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    const p = svgCoords(e);
    if (!p) return;
    const target = dragging.poly === 'red' ? redPolygon : greenPolygon;
    const next = target.map((pt, i) => (i === dragging.idx ? p : pt));
    onChange(dragging.poly, next);
  }

  function onPointerUp() {
    setDragging(null);
  }

  function onPointContextMenu(e: MouseEvent<SVGCircleElement>, poly: 'red' | 'green', idx: number) {
    e.preventDefault();
    e.stopPropagation();
    const target = poly === 'red' ? redPolygon : greenPolygon;
    onChange(poly, target.filter((_, i) => i !== idx));
  }

  const renderPolygon = (poly: Point[], color: 'red' | 'green') => {
    if (poly.length === 0) return null;
    const colors = COLORS[color];
    return (
      <g key={color}>
        {poly.length >= 3 ? (
          <polygon points={polygonToPoints(poly, naturalSize, displaySize)} fill={colors.fill} stroke={colors.stroke} strokeWidth={2} />
        ) : (
          <polyline points={polygonToPoints(poly, naturalSize, displaySize)} fill="none" stroke={colors.stroke} strokeWidth={2} />
        )}
        {poly.map((p, i) => {
          const d = scaleToDisplay(p, naturalSize, displaySize);
          return (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={5}
              fill={colors.stroke}
              stroke="#fff"
              strokeWidth={1.5}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => onPointPointerDown(e, color, i)}
              onContextMenu={(e) => onPointContextMenu(e, color, i)}
            />
          );
        })}
      </g>
    );
  };

  return (
    <div
      className="relative inline-block select-none"
      style={{ width: displaySize.w, height: displaySize.h }}
    >
      <img src={imageSrc} alt="Кадр камеры" draggable={false} width={displaySize.w} height={displaySize.h} />
      <svg
        ref={svgRef}
        width={displaySize.w}
        height={displaySize.h}
        className="absolute inset-0"
        style={{ cursor: dragging ? 'grabbing' : 'crosshair' }}
        onClick={onSvgClick}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {renderPolygon(redPolygon, 'red')}
        {renderPolygon(greenPolygon, 'green')}
      </svg>
    </div>
  );
}
