  export type HipLayerId =
  | "XRAY"
  | "REFERENCE"
  | "MEASUREMENT"
  | "LLD"
  | "IMPLANT_STEM"
  | "IMPLANT_CUP";

export type HipLayer = {
  id: HipLayerId;
  label: string;
  visible: boolean;
};
