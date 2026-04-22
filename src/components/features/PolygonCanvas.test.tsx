import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PolygonCanvas } from './PolygonCanvas';

describe('PolygonCanvas', () => {
  it('renders svg with both polygons when given points', () => {
    const { container } = render(
      <PolygonCanvas
        naturalSize={{ w: 1920, h: 1080 }}
        displaySize={{ w: 1280, h: 720 }}
        redPolygon={[{x:0,y:0},{x:1920,y:0},{x:1920,y:1080},{x:0,y:1080}]}
        greenPolygon={[{x:100,y:100},{x:200,y:100},{x:200,y:200}]}
        activePolygon="red"
        onChange={() => {}}
        imageSrc="blob:fake"
      />
    );
    const polygons = container.querySelectorAll('polygon');
    expect(polygons).toHaveLength(2);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(7);
  });

  it('scales red polygon points to display size (origin stays at 0,0; corner goes to 1280,720)', () => {
    const { container } = render(
      <PolygonCanvas
        naturalSize={{ w: 1920, h: 1080 }}
        displaySize={{ w: 1280, h: 720 }}
        redPolygon={[{x:0,y:0},{x:1920,y:1080}]}
        greenPolygon={[]}
        activePolygon="red"
        onChange={() => {}}
        imageSrc="blob:fake"
      />
    );
    const polyline = container.querySelector('polyline');
    expect(polyline?.getAttribute('points')).toBe('0,0 1280,720');
  });
});
