import type { Point } from '@/types/api';

export interface Size { w: number; h: number }

export function scaleToDisplay(p: Point, natural: Size, display: Size): Point {
  return {
    x: Math.round((p.x * display.w) / natural.w),
    y: Math.round((p.y * display.h) / natural.h),
  };
}

export function scaleToNatural(p: Point, natural: Size, display: Size): Point {
  return {
    x: Math.round((p.x * natural.w) / display.w),
    y: Math.round((p.y * natural.h) / display.h),
  };
}
