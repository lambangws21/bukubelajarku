import type { Axis, Point } from "./types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function angleOfAxis(axis: Axis): number {
  // radians, -PI..PI
  return Math.atan2(axis.b.y - axis.a.y, axis.b.x - axis.a.x);
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function normalizeRad(rad: number): number {
  // normalize to (-PI..PI]
  const twoPi = Math.PI * 2;
  let r = rad % twoPi;
  if (r <= -Math.PI) r += twoPi;
  if (r > Math.PI) r -= twoPi;
  return r;
}

export function signedAngleBetween(aRad: number, bRad: number): number {
  // returns b - a normalized (-PI..PI]
  return normalizeRad(bRad - aRad);
}

export function midPoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
