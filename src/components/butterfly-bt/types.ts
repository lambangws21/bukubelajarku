export type Point = { x: number; y: number };

export type AxisKey = "femur" | "tibia";

export type Axis = {
  a: Point; // start
  b: Point; // end
};

export type Axes = Record<AxisKey, Axis>;
