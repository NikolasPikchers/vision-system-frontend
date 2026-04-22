import { describe, it, expect } from 'vitest';
import { scaleToDisplay, scaleToNatural } from './polygon';

describe('polygon scaling', () => {
  const natural = { w: 1920, h: 1080 };
  const display = { w: 1280, h: 720 };

  it('scales natural → display', () => {
    expect(scaleToDisplay({ x: 1920, y: 1080 }, natural, display)).toEqual({ x: 1280, y: 720 });
  });

  it('scales display → natural', () => {
    expect(scaleToNatural({ x: 640, y: 360 }, natural, display)).toEqual({ x: 960, y: 540 });
  });

  it('scales origin to origin', () => {
    expect(scaleToDisplay({ x: 0, y: 0 }, natural, display)).toEqual({ x: 0, y: 0 });
    expect(scaleToNatural({ x: 0, y: 0 }, natural, display)).toEqual({ x: 0, y: 0 });
  });

  it('round-trip preserves coordinates within 2px', () => {
    const p = { x: 357, y: 691 };
    const r = scaleToNatural(scaleToDisplay(p, natural, display), natural, display);
    expect(Math.abs(r.x - p.x)).toBeLessThan(2);
    expect(Math.abs(r.y - p.y)).toBeLessThan(2);
  });
});
