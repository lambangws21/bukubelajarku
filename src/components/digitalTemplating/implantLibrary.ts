// src/components/digitalTemplating/implantLibrary.ts


export type ImplantSystem =
  | "ML Taper"
  | "CPT Cemented"
  | "Wagner SL";


export type ImplantLibraryItem = {
    id: string;
    brand: "Zimmer";
    system: ImplantSystem;
    type: "stem" | "cup";
  
    size: number;
    label: string;        // ⬅️ INI UNTUK UI
    imageSrc: string;
  };

  export type ImplantCanvasObject = {
    id: string;
    type: "implant";
    name: string;
    imageSrc: string;
    // basePx: number;
    position: { x: number; y: number };
  
    scaleX: number;
    scaleY: number;

    flipX?: 1 | -1;
    flipY?: 1 | -1;  
    rotation: number;
    opacity: number;
    realLengthMm?: number;
    locked: boolean; // 🔒 lock aspect ratio
  };
  
  
  export const STEM_LIBRARY: ImplantLibraryItem[] = [
    {
      id: "mlt-4",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 4,
      label: "ML Taper Size 4",
      imageSrc: "/images/implant/ml-tapper/size4.png",
    },
    {
      id: "mlt-5",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 5,
      label: "ML Taper Size 5",
      imageSrc: "/images/implant/ml-tapper/size5.png",
    },
    {
      id: "mlt-6",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 6,
      label: "ML Taper Size 6",
      imageSrc: "/images/implant/ml-tapper/size6.png",
    },
    {
      id: "mlt-7-5",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 7.5,
      label: "ML Taper Size 7.5",
      imageSrc: "/images/implant/ml-tapper/size7-5.png",
    },
    {
      id: "mlt-9",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 9,
      label: "ML Taper Size 9",
      imageSrc: "/images/implant/ml-tapper/size9.png",
    },
    {
      id: "mlt-10",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 10,
      label: "ML Taper Size 10",
      imageSrc: "/images/implant/ml-tapper/size10.png",
    },
    {
      id: "mlt-11",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 11,
      label: "ML Taper Size 11",
      imageSrc: "/images/implant/ml-tapper/size11.png",
    },
    {
      id: "mlt-12-5",
      brand: "Zimmer",
      system: "ML Taper",
      type: "stem",
      size: 12.5,
      label: "ML Taper Size 12.5",
      imageSrc: "/images/implant/ml-tapper/size12-5.png",
    },
    {
      id: "cptxs-1",
      brand: "Zimmer",
      system: "CPT Cemented",
      type: "stem",
      size: 0.1,
      label: "CPT Cemented Size XS",
      imageSrc: "/images/implant/CPT/CPTXS.png",
    },
    {
      id: "cptxs-0",
      brand: "Zimmer",
      system: "CPT Cemented",
      type: "stem",
      size: 0,
      label: "CPT Cemented Size 0",
      imageSrc: "/images/implant/CPT/CPT0.png",
    },
    {
      id: "cpt-1",
      brand: "Zimmer",
      system: "CPT Cemented",
      type: "stem",
      size: 1,
      label: "CPT Cemented Size 1",
      imageSrc: "/images/implant/CPT/CPT1.png",
    },
    {
      id: "cpt-2",
      brand: "Zimmer",
      system: "CPT Cemented",
      type: "stem",
      size: 2,
      label: "CPT Cemented Size 2",
      imageSrc: "/images/implant/CPT/CPT2.png",
    },
    {
      id: "cpt-3",
      brand: "Zimmer",
      system: "CPT Cemented",
      type: "stem",
      size: 3,
      label: "CPT Cemented Size 3",
      imageSrc: "/images/implant/CPT/CPT3.png",
    },
    {
        id: "wagner-1415",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 14.15,
        label: "Wagner SL Size 14-15",
        imageSrc: "/images/implant/wagner/wagner14-15.png",
      },
      {
        id: "wagner-1617",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 16.17,
        label: "Wagner SL Size 16-17",
        imageSrc: "/images/implant/wagner/wagner16-17.png",
      },
      {
        id: "wagner-1819",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 18.19,
        label: "Wagner SL Size 18-19",
        imageSrc: "/images/implant/wagner/wagner18-19.png",
      },
      {
        id: "wagner-2021",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 20.21,
        label: "Wagner SL Size 20-21",
        imageSrc: "/images/implant/wagner/wagner20-21.png",
      },
      {
        id: "wagner-2223",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 22.23,
        label: "Wagner SL Size 22-23",
        imageSrc: "/images/implant/wagner/wagner22-23.png",
      },
      {
        id: "wagner-2425",
        brand: "Zimmer",
        system: "Wagner SL",
        type: "stem",
        size: 23.24,
        label: "Wagner SL Size 24-25",
        imageSrc: "/images/implant/wagner/wagner24-25.png",
      },
  ];
  