import type { Variants } from "framer-motion";

export const XRAY_BASE_WIDTH = 1429;
export const XRAY_BASE_HEIGHT = 742;

export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5] as const;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 5;
export const ZOOM_STEP = 0.05;

export const RULER_COLOR = "#22c55e";
export const LLD_COLOR = "#38bdf8";
export const OFFSET_COLOR = "#f59e0b";
export const ANGLE_COLOR = "#CF0F47";
export const DRAW_LINE_COLOR = "#a855f7";
export const AHKA_COLOR = "#ef4444";
export const VALGUS_CUT_COLOR = "#f97316";
export const TIBIAL_SLOPE_COLOR = "#06b6d4";
export const TIBIAL_CUT_COLOR = "#FFE100";

export const MEASURE_STROKE_WIDTH = 1.5;
export const MEASURE_HANDLE_RADIUS = 2.5;
export const MEASURE_FONT_SIZE = 11;
export const MEASURE_LABEL_STROKE_WIDTH = 2.5;
export const ANGLE_STROKE_WIDTH = 2.5;
export const ANGLE_POINT_RADIUS = 3.5;
export const ANGLE_FONT_SIZE = 11;
export const ANGLE_LABEL_STROKE_WIDTH = 2.5;

export const TOUR_STORAGE_KEY = "templating-tour-v2";
export const CALIBRATION_STORAGE_KEY = "templating-calibration-presets";
export const SESSION_STORAGE_KEY = "templating-session-v1";

export const collapseVariants: Variants = {
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};
