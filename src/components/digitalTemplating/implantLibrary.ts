// src/components/digitalTemplating/implantLibrary.ts



export type ImplantLibraryItem = {
    id: string;
    brand: "Zimmer";
    system: "ML Taper";
    type: "stem";
  
    size: number;
    label: string;        // ⬅️ INI UNTUK UI
    imageSrc: string;
  };

  export type ImplantCanvasObject = {
    id: string;
    type: "implant";
    name: string;
    imageSrc: string;
  
    position: { x: number; y: number };
  
    scaleX: number;
    scaleY: number;
  
    rotation: number;
    opacity: number;
  
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
  ];
  