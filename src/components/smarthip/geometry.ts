export type Point = { x: number; y: number };

export function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function midPoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function isNearPoint(
  a: Point,
  b: Point,
  tol = 8
) {
  return distance(a, b) <= tol;
}

export function measureMm(
  p1: Point,
  p2: Point,
  mmPerPixel: number
) {
  return distance(p1, p2) * mmPerPixel;
}

export function projectPointToLine(
  p: Point,
  a: Point,
  b: Point
): Point {
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const t =
    (ap.x * ab.x + ap.y * ab.y) /
    (ab.x * ab.x + ab.y * ab.y);

  return { x: a.x + ab.x * t, y: a.y + ab.y * t };
}

export function snapLineToAxis(
  p1: Point,
  p2: Point,
  a1: Point,
  a2: Point
) {
  const mid = midPoint(p1, p2);
  const snap = projectPointToLine(mid, a1, a2);
  const dx = snap.x - mid.x;
  const dy = snap.y - mid.y;

  return {
    p1: { x: p1.x + dx, y: p1.y + dy },
    p2: { x: p2.x + dx, y: p2.y + dy },
  };
}
