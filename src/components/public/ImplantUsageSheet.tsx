"use client";

import {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NextImage from "next/image";
import {
  Camera,
  Check,
  Eraser,
  Eye,
  FileImage,
  PenLine,
  Plus,
  Printer,
  RefreshCcw,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";

type EnhancedImage = {
  original: string | null;
  enhanced: string | null;
};

type LabelSlot = EnhancedImage & {
  id: number;
  label: string;
  implantName: string;
  implantCode: string;
};

type SignatureSlot = EnhancedImage & {
  id: string;
  roleLabel: string;
  personName: string;
};

type EnhanceSettings = {
  contrast: number;
  brightness: number;
  sharpness: number;
};

type DraftImageState = {
  image: string | null;
};

type DraftSlot = DraftImageState & {
  id: number;
  label: string;
  implantName: string;
  implantCode: string;
};

type DraftSignature = DraftImageState & {
  id: string;
  roleLabel: string;
  personName: string;
};

type ImplantUsageDraft = {
  version: number;
  updatedAt: string;
  operationDate: string;
  doctorName: string;
  hospitalName: string;
  repAssist: string;
  systemName: string;
  invoiceTo: string;
  patientName: string;
  medrec: string;
  region: string;
  patientSticker: string | null;
  slots: DraftSlot[];
  signatures: DraftSignature[];
  useEnhanced: boolean;
  enhanceSettings: EnhanceSettings;
  signatureMinWidth: number;
  implantAspectRatio: number;
};

const createLabelSlots = (count = 6): LabelSlot[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    label: `Kolom Label ${index + 1}`,
    implantName: "",
    implantCode: "",
    original: null,
    enhanced: null,
  }));

const createSignatureSlots = (): SignatureSlot[] => [
  {
    id: "approved",
    roleLabel: "Disetujui oleh",
    personName: "",
    original: null,
    enhanced: null,
  },
  {
    id: "assist",
    roleLabel: "Asistensi",
    personName: "",
    original: null,
    enhanced: null,
  },
  {
    id: "or",
    roleLabel: "Petugas Kamar Operasi",
    personName: "",
    original: null,
    enhanced: null,
  },
];

const DRAFT_STORAGE_KEY = "implant-usage-sheet-draft-v1";
const DRAFT_VERSION = 1;
const DEFAULT_ENHANCE_SETTINGS: EnhanceSettings = {
  contrast: 132,
  brightness: 110,
  sharpness: 28,
};
const DEFAULT_SIGNATURE_MIN_WIDTH = 290;
const SIGNATURE_WIDTH_PRESETS = [
  { label: "Normal", value: 260 },
  { label: "Lebar", value: 320 },
  { label: "Sangat Lebar", value: 380 },
] as const;
const IMPLANT_RATIO_PRESETS = [
  { label: "Standar", value: 3.4 },
  { label: "Lebar", value: 3.8 },
  { label: "Sangat Lebar", value: 4.4 },
] as const;
const DEFAULT_IMPLANT_ASPECT_RATIO = 3.8;

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar"));
    image.src = src;
  });

const clamp = (value: number) => Math.max(0, Math.min(255, value));

const applySharpen = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
) => {
  if (strength <= 0) return pixels;

  const copy = new Uint8ClampedArray(pixels);
  const k = strength;
  const kernel = [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        let sum = 0;
        let kernelIndex = 0;

        for (let ky = -1; ky <= 1; ky += 1) {
          for (let kx = -1; kx <= 1; kx += 1) {
            const sampleIdx = ((y + ky) * width + (x + kx)) * 4 + channel;
            sum += copy[sampleIdx] * kernel[kernelIndex];
            kernelIndex += 1;
          }
        }

        pixels[idx + channel] = clamp(sum);
      }
    }
  }

  return pixels;
};

const enhanceImage = async (src: string, settings: EnhanceSettings) => {
  const image = await loadImageElement(src);

  const maxSize = 1600;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas context tidak tersedia");

  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const contrastFactor = settings.contrast / 100;
  const brightnessFactor = settings.brightness / 100;

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = clamp((pixels[i] - 128) * contrastFactor + 128);
    pixels[i + 1] = clamp((pixels[i + 1] - 128) * contrastFactor + 128);
    pixels[i + 2] = clamp((pixels[i + 2] - 128) * contrastFactor + 128);

    pixels[i] = clamp(pixels[i] * brightnessFactor);
    pixels[i + 1] = clamp(pixels[i + 1] * brightnessFactor);
    pixels[i + 2] = clamp(pixels[i + 2] * brightnessFactor);
  }

  applySharpen(pixels, width, height, settings.sharpness / 100);

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
};

const enhanceFromOriginal = async (
  original: string,
  settings: EnhanceSettings
): Promise<EnhancedImage> => {
  const enhanced = await enhanceImage(original, settings);
  return {
    original,
    enhanced,
  };
};

const extractLotRef = (rawText: string) => {
  const raw = String(rawText || "").replace(/\s+/g, " ").trim();
  if (!raw) return null;

  const refMatch = raw.match(/(?:\bREF\b|\bREFERENCE\b)\s*[:#-]?\s*([A-Z0-9-]{3,})/i);
  const lotMatch = raw.match(/(?:\bLOT\b|\bLOTNO\b|\bLOT NO\b)\s*[:#-]?\s*([A-Z0-9-]{3,})/i);

  const ref = refMatch?.[1] || "";
  const lot = lotMatch?.[1] || "";

  if (ref || lot) {
    return [ref ? `REF ${ref}` : "", lot ? `LOT ${lot}` : ""].filter(Boolean).join(" | ");
  }

  return raw.slice(0, 120);
};

const detectLotRefFromImage = async (src: string) => {
  const barcodeCtor = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
  if (!barcodeCtor) return null;

  try {
    const formats = await barcodeCtor.getSupportedFormats?.().catch(() => null);
    const detector = new barcodeCtor(
      formats?.length
        ? { formats }
        : { formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"] }
    );

    const image = await loadImageElement(src);
    const results = await detector.detect(image);
    if (!Array.isArray(results) || results.length === 0) return null;

    const mergedRaw = results
      .map((item: { rawValue?: string }) => String(item?.rawValue || "").trim())
      .filter(Boolean)
      .join(" | ");

    return extractLotRef(mergedRaw);
  } catch {
    return null;
  }
};

const emptyImage = (): EnhancedImage => ({
  original: null,
  enhanced: null,
});

const imageToDraft = (image: EnhancedImage): string | null => image.enhanced || image.original || null;

const draftToImage = (value: unknown): EnhancedImage => {
  if (typeof value !== "string" || !value) return emptyImage();
  return {
    original: value,
    enhanced: value,
  };
};

const SLOT_PER_SHEET = 9;

export default function ImplantUsageSheet() {
  const [operationDate, setOperationDate] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [repAssist, setRepAssist] = useState("");
  const [systemName, setSystemName] = useState("");
  const [invoiceTo, setInvoiceTo] = useState("");

  const [patientName, setPatientName] = useState("");
  const [medrec, setMedrec] = useState("");
  const [region, setRegion] = useState("");

  const [patientSticker, setPatientSticker] = useState<EnhancedImage>(emptyImage);
  const [slots, setSlots] = useState<LabelSlot[]>(() => createLabelSlots(6));
  const [signatures, setSignatures] = useState<SignatureSlot[]>(() => createSignatureSlots());
  const [signingIndex, setSigningIndex] = useState<number | null>(null);

  const [useEnhanced, setUseEnhanced] = useState(true);
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [scanningSlotIndex, setScanningSlotIndex] = useState<number | null>(null);
  const [enhanceSettings, setEnhanceSettings] = useState<EnhanceSettings>(DEFAULT_ENHANCE_SETTINGS);
  const [signatureMinWidth, setSignatureMinWidth] = useState(DEFAULT_SIGNATURE_MIN_WIDTH);
  const [implantAspectRatio, setImplantAspectRatio] = useState(DEFAULT_IMPLANT_ASPECT_RATIO);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const activeSignaturePreset = useMemo(
    () => SIGNATURE_WIDTH_PRESETS.find((item) => item.value === signatureMinWidth)?.label ?? null,
    [signatureMinWidth]
  );
  const activeImplantRatioPreset = useMemo(
    () => IMPLANT_RATIO_PRESETS.find((item) => item.value === implantAspectRatio)?.label ?? null,
    [implantAspectRatio]
  );

  const slotUploadRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slotCameraRefs = useRef<(HTMLInputElement | null)[]>([]);

  const patientUploadRef = useRef<HTMLInputElement | null>(null);
  const patientCameraRef = useRef<HTMLInputElement | null>(null);

  const signatureUploadRefs = useRef<(HTMLInputElement | null)[]>([]);
  const signatureCameraRefs = useRef<(HTMLInputElement | null)[]>([]);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasStrokeRef = useRef(false);

  const previewCount = useMemo(
    () => slots.filter((slot) => Boolean(slot.original)).length,
    [slots]
  );

  const signatureFilledCount = useMemo(
    () => signatures.filter((item) => Boolean(item.original)).length,
    [signatures]
  );
  const estimatedSheetCount = useMemo(
    () => Math.max(1, Math.ceil(slots.length / SLOT_PER_SHEET)),
    [slots.length]
  );
  const isSingleSheetLayout = slots.length <= SLOT_PER_SHEET;
  const slotPages = useMemo(() => {
    const pages: Array<{ pageIndex: number; start: number; items: LabelSlot[] }> = [];
    for (let start = 0; start < slots.length; start += SLOT_PER_SHEET) {
      pages.push({
        pageIndex: pages.length,
        start,
        items: slots.slice(start, start + SLOT_PER_SHEET),
      });
    }
    return pages.length ? pages : [{ pageIndex: 0, start: 0, items: [] }];
  }, [slots]);
  const hasTypedPatientIdentity = Boolean(patientName.trim() || medrec.trim());
  const hasPatientSticker = Boolean(patientSticker.original);
  const showPatientTextFields = !hasPatientSticker;
  const showPatientStickerBlock = !hasTypedPatientIdentity || hasPatientSticker;
  const showRegionInTopFields = !hasPatientSticker;

  const setImageFromFile = async (file: File) => {
    const original = await readFileAsDataURL(file);
    return enhanceFromOriginal(original, enhanceSettings);
  };

  const handlePickSlotFile =
    (slotIndex: number) => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const imageState = await setImageFromFile(file);
        const detectedCode = await detectLotRefFromImage(imageState.enhanced || imageState.original || "");
        setSlots((prev) =>
          prev.map((slot, index) =>
            index === slotIndex
              ? {
                  ...slot,
                  ...imageState,
                  implantCode: detectedCode || slot.implantCode,
                }
              : slot
          )
        );
      } catch (error) {
        console.error(error);
        alert("Gagal memproses gambar pada kolom ini.");
      } finally {
        event.target.value = "";
      }
    };

  const handlePickPatientSticker = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageState = await setImageFromFile(file);
      setPatientSticker(imageState);
      setPatientName("");
      setMedrec("");
    } catch (error) {
      console.error(error);
      alert("Gagal memproses stiker pasien.");
    } finally {
      event.target.value = "";
    }
  };

  const handlePickSignatureFile =
    (signatureIndex: number) => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const imageState = await setImageFromFile(file);
        setSignatures((prev) =>
          prev.map((item, index) =>
            index === signatureIndex
              ? {
                  ...item,
                  ...imageState,
                }
              : item
          )
        );
      } catch (error) {
        console.error(error);
        alert("Gagal memproses foto tanda tangan.");
      } finally {
        event.target.value = "";
      }
    };

  const handleEnhanceAll = async () => {
    setEnhancingAll(true);
    try {
      const nextSlots = await Promise.all(
        slots.map(async (slot) => {
          if (!slot.original) return slot;
          const enhanced = await enhanceImage(slot.original, enhanceSettings);
          return { ...slot, enhanced };
        })
      );

      const nextPatientSticker =
        patientSticker.original !== null
          ? {
              ...patientSticker,
              enhanced: await enhanceImage(patientSticker.original, enhanceSettings),
            }
          : patientSticker;

      const nextSignatures = await Promise.all(
        signatures.map(async (item) => {
          if (!item.original) return item;
          const enhanced = await enhanceImage(item.original, enhanceSettings);
          return { ...item, enhanced };
        })
      );

      setSlots(nextSlots);
      setPatientSticker(nextPatientSticker);
      setSignatures(nextSignatures);
      setUseEnhanced(true);
    } catch (error) {
      console.error(error);
      alert("Gagal menerapkan peningkatan kualitas foto.");
    } finally {
      setEnhancingAll(false);
    }
  };

  const clearSlot = (slotIndex: number) => {
    setSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              ...emptyImage(),
            }
          : slot
      )
    );
  };

  const clearSignature = (signatureIndex: number) => {
    setSignatures((prev) =>
      prev.map((item, index) =>
        index === signatureIndex
          ? {
              ...item,
              ...emptyImage(),
            }
          : item
      )
    );
  };

  const clearAll = () => {
    setSlots((prev) => prev.map((item) => ({ ...item, ...emptyImage() })));
    setPatientSticker(emptyImage());
    setSignatures((prev) => prev.map((item) => ({ ...item, ...emptyImage() })));
  };

  const resetFormToInitial = () => {
    setOperationDate("");
    setDoctorName("");
    setHospitalName("");
    setRepAssist("");
    setSystemName("");
    setInvoiceTo("");

    setPatientName("");
    setMedrec("");
    setRegion("");
    setPatientSticker(emptyImage());

    setSlots(createLabelSlots(6));
    setSignatures(createSignatureSlots());
    setSigningIndex(null);
    setScanningSlotIndex(null);

    setUseEnhanced(true);
    setEnhanceSettings(DEFAULT_ENHANCE_SETTINGS);
    setSignatureMinWidth(DEFAULT_SIGNATURE_MIN_WIDTH);
    setImplantAspectRatio(DEFAULT_IMPLANT_ASPECT_RATIO);
  };

  const handleResetDraft = () => {
    const confirmed = window.confirm(
      "Reset form dan mulai data baru? Draf tersimpan saat ini akan dihapus."
    );
    if (!confirmed) return;

    resetFormToInitial();
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastDraftSavedAt(null);
  };

  const handleSignatureWidthChange = (nextValue: number) => {
    const safe = Math.min(420, Math.max(220, Number(nextValue) || DEFAULT_SIGNATURE_MIN_WIDTH));
    setSignatureMinWidth(safe);
  };
  const handleImplantAspectRatioChange = (nextValue: number) => {
    const safe = Math.min(4.8, Math.max(3.0, Number(nextValue) || DEFAULT_IMPLANT_ASPECT_RATIO));
    setImplantAspectRatio(Number(safe.toFixed(1)));
  };

  const handlePatientNameChange = (value: string) => {
    setPatientName(value);
    if (value.trim()) {
      setPatientSticker(emptyImage());
    }
  };

  const handleMedrecChange = (value: string) => {
    setMedrec(value);
    if (value.trim()) {
      setPatientSticker(emptyImage());
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        setDraftHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<ImplantUsageDraft>;
      if (!parsed || parsed.version !== DRAFT_VERSION) {
        setDraftHydrated(true);
        return;
      }

      setOperationDate(typeof parsed.operationDate === "string" ? parsed.operationDate : "");
      setDoctorName(typeof parsed.doctorName === "string" ? parsed.doctorName : "");
      setHospitalName(typeof parsed.hospitalName === "string" ? parsed.hospitalName : "");
      setRepAssist(typeof parsed.repAssist === "string" ? parsed.repAssist : "");
      setSystemName(typeof parsed.systemName === "string" ? parsed.systemName : "");
      setInvoiceTo(typeof parsed.invoiceTo === "string" ? parsed.invoiceTo : "");
      setPatientName(typeof parsed.patientName === "string" ? parsed.patientName : "");
      setMedrec(typeof parsed.medrec === "string" ? parsed.medrec : "");
      setRegion(typeof parsed.region === "string" ? parsed.region : "");
      setPatientSticker(draftToImage(parsed.patientSticker));

      const parsedSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
      const nextSlots = parsedSlots.map((item, index) => ({
        id: typeof item.id === "number" ? item.id : index + 1,
        label: typeof item.label === "string" && item.label.trim() ? item.label : `Kolom Label ${index + 1}`,
        implantName: typeof item.implantName === "string" ? item.implantName : "",
        implantCode: typeof item.implantCode === "string" ? item.implantCode : "",
        ...draftToImage(item.image),
      }));
      while (nextSlots.length < 6) {
        nextSlots.push({
          id: nextSlots.length + 1,
          label: `Kolom Label ${nextSlots.length + 1}`,
          implantName: "",
          implantCode: "",
          ...emptyImage(),
        });
      }
      setSlots(nextSlots.length ? nextSlots : createLabelSlots(6));

      const parsedSignatures = Array.isArray(parsed.signatures) ? parsed.signatures : [];
      const defaultSignatures = createSignatureSlots();
      const nextSignatures = defaultSignatures.map((item, index) => {
        const fromDraft = parsedSignatures[index];
        return {
          ...item,
          roleLabel:
            typeof fromDraft?.roleLabel === "string" && fromDraft.roleLabel.trim()
              ? fromDraft.roleLabel
              : item.roleLabel,
          personName: typeof fromDraft?.personName === "string" ? fromDraft.personName : "",
          ...draftToImage(fromDraft?.image),
        };
      });
      setSignatures(nextSignatures);

      setUseEnhanced(parsed.useEnhanced !== undefined ? Boolean(parsed.useEnhanced) : true);
      if (parsed.enhanceSettings) {
        setEnhanceSettings({
          contrast:
            typeof parsed.enhanceSettings.contrast === "number"
              ? parsed.enhanceSettings.contrast
              : DEFAULT_ENHANCE_SETTINGS.contrast,
          brightness:
            typeof parsed.enhanceSettings.brightness === "number"
              ? parsed.enhanceSettings.brightness
              : DEFAULT_ENHANCE_SETTINGS.brightness,
          sharpness:
            typeof parsed.enhanceSettings.sharpness === "number"
              ? parsed.enhanceSettings.sharpness
              : DEFAULT_ENHANCE_SETTINGS.sharpness,
        });
      }
      setSignatureMinWidth(
        typeof parsed.signatureMinWidth === "number"
          ? Math.min(420, Math.max(220, parsed.signatureMinWidth))
          : DEFAULT_SIGNATURE_MIN_WIDTH
      );
      setImplantAspectRatio(
        typeof parsed.implantAspectRatio === "number"
          ? Number(Math.min(4.8, Math.max(3.0, parsed.implantAspectRatio)).toFixed(1))
          : DEFAULT_IMPLANT_ASPECT_RATIO
      );

      setLastDraftSavedAt(typeof parsed.updatedAt === "string" ? parsed.updatedAt : null);
    } catch (error) {
      console.warn("Gagal memuat draft:", error);
    } finally {
      setDraftHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;

    const timeout = window.setTimeout(() => {
      const draftPayload: ImplantUsageDraft = {
        version: DRAFT_VERSION,
        updatedAt: new Date().toISOString(),
        operationDate,
        doctorName,
        hospitalName,
        repAssist,
        systemName,
        invoiceTo,
        patientName,
        medrec,
        region,
        patientSticker: imageToDraft(patientSticker),
        slots: slots.map((item) => ({
          id: item.id,
          label: item.label,
          implantName: item.implantName,
          implantCode: item.implantCode,
          image: imageToDraft(item),
        })),
        signatures: signatures.map((item) => ({
          id: item.id,
          roleLabel: item.roleLabel,
          personName: item.personName,
          image: imageToDraft(item),
        })),
        useEnhanced,
        enhanceSettings,
        signatureMinWidth,
        implantAspectRatio,
      };

      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
        setLastDraftSavedAt(draftPayload.updatedAt);
      } catch (error) {
        console.warn("Gagal menyimpan draft:", error);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    draftHydrated,
    operationDate,
    doctorName,
    hospitalName,
    repAssist,
    systemName,
    invoiceTo,
    patientName,
    medrec,
    region,
    patientSticker,
    slots,
    signatures,
    useEnhanced,
    enhanceSettings,
    signatureMinWidth,
    implantAspectRatio,
  ]);

  const addNewSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        label: `Kolom Label ${prev.length + 1}`,
        implantName: "",
        implantCode: "",
        ...emptyImage(),
      },
    ]);
  };

  const updateSlotLabel = (slotIndex: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              label: value,
            }
          : slot
      )
    );
  };

  const updateSlotImplantName = (slotIndex: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              implantName: value,
            }
          : slot
      )
    );
  };

  const updateSlotImplantCode = (slotIndex: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              implantCode: value,
            }
          : slot
      )
    );
  };

  const scanLotRefForSlot = async (slotIndex: number) => {
    const source = slots[slotIndex]?.enhanced || slots[slotIndex]?.original;
    if (!source) {
      alert("Tambahkan foto label implant terlebih dahulu.");
      return;
    }

    setScanningSlotIndex(slotIndex);
    try {
      const detected = await detectLotRefFromImage(source);
      if (!detected) {
        alert(
          "LOT/REF belum terdeteksi. Pastikan barcode/QR terlihat jelas, lalu coba ulangi atau isi manual."
        );
        return;
      }
      setSlots((prev) =>
        prev.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                implantCode: detected,
              }
            : slot
        )
      );
    } finally {
      setScanningSlotIndex(null);
    }
  };

  const updateSignatureLabel = (signatureIndex: number, value: string) => {
    setSignatures((prev) =>
      prev.map((item, index) =>
        index === signatureIndex
          ? {
              ...item,
              roleLabel: value,
            }
          : item
      )
    );
  };

  const updateSignatureName = (signatureIndex: number, value: string) => {
    setSignatures((prev) =>
      prev.map((item, index) =>
        index === signatureIndex
          ? {
              ...item,
              personName: value,
            }
          : item
      )
    );
  };

  const getDisplayImage = (image: EnhancedImage) =>
    useEnhanced ? image.enhanced || image.original : image.original;
  const currentSigningRole =
    signingIndex !== null ? signatures[signingIndex]?.roleLabel || "Tanda Tangan" : "Tanda Tangan";
  const draftStatusText = useMemo(() => {
    if (!draftHydrated) return "Memuat draf...";
    if (!lastDraftSavedAt) return "Draf lokal belum tersimpan";

    const draftDate = new Date(lastDraftSavedAt);
    if (Number.isNaN(draftDate.getTime())) return "Draf lokal tersimpan";

    return `Draf tersimpan ${draftDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }, [draftHydrated, lastDraftSavedAt]);

  useEffect(() => {
    if (signingIndex === null) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#0f172a";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";

    isDrawingRef.current = false;
    hasStrokeRef.current = false;
  }, [signingIndex]);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    isDrawingRef.current = true;
    hasStrokeRef.current = true;
  };

  const drawSignature = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const point = getCanvasPoint(event);
    if (!point) return;

    event.preventDefault();
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    isDrawingRef.current = false;
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
    hasStrokeRef.current = false;
  };

  const saveSignatureCanvas = () => {
    if (signingIndex === null) return;
    if (!hasStrokeRef.current) {
      alert("Silakan gambar tanda tangan terlebih dahulu.");
      return;
    }
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignatures((prev) =>
      prev.map((item, index) =>
        index === signingIndex
          ? {
              ...item,
              original: dataUrl,
              enhanced: dataUrl,
            }
          : item
      )
    );
    setSigningIndex(null);
  };

  const printSheet = () => {
    window.print();
  };

  const printPreview = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-5 sm:py-6 print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl space-y-4 print:max-w-none print:space-y-0">
        <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 print:hidden">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-lg font-bold sm:text-xl">Lembar Pemakaian Implant</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Isi data operasi dan tempel foto label implant di setiap kolom. Kamera/upload tersedia per kolom.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Label terisi: {previewCount}/{slots.length} | Tanda tangan foto:{" "}
                {signatureFilledCount}/{signatures.length} | Estimasi lembar cetak: {estimatedSheetCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={addNewSlot}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Plus size={14} />
                  Kolom
                </button>
                <button
                  type="button"
                  onClick={handleEnhanceAll}
                  disabled={enhancingAll}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Wand2 size={14} />
                  {enhancingAll ? "Proses" : "Enhance"}
                </button>
                <button
                  type="button"
                  onClick={() => setUseEnhanced((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <RefreshCcw size={14} />
                  {useEnhanced ? "Asli" : "Enhanced"}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Trash2 size={14} />
                  Hapus Foto
                </button>
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                >
                  <RotateCcw size={14} />
                  Reset Baru
                </button>
                <button
                  type="button"
                  onClick={printPreview}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Eye size={14} />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={printSheet}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <Printer size={14} />
                  Print
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{draftStatusText}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Kontras: {enhanceSettings.contrast}%
              <input
                type="range"
                min={90}
                max={180}
                value={enhanceSettings.contrast}
                onChange={(e) =>
                  setEnhanceSettings((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Brightness: {enhanceSettings.brightness}%
              <input
                type="range"
                min={90}
                max={160}
                value={enhanceSettings.brightness}
                onChange={(e) =>
                  setEnhanceSettings((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Sharpness: {enhanceSettings.sharpness}%
              <input
                type="range"
                min={0}
                max={70}
                value={enhanceSettings.sharpness}
                onChange={(e) =>
                  setEnhanceSettings((prev) => ({ ...prev, sharpness: Number(e.target.value) }))
                }
                className="mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Lebar Kolom TTD: {signatureMinWidth}px
              <input
                type="range"
                min={220}
                max={420}
                step={10}
                value={signatureMinWidth}
                onInput={(e) => handleSignatureWidthChange(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => handleSignatureWidthChange(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {SIGNATURE_WIDTH_PRESETS.map((preset) => {
                  const isActive = signatureMinWidth === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSignatureWidthChange(preset.value)}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                        isActive
                          ? "border-slate-700 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                {activeSignaturePreset
                  ? `Preset aktif: ${activeSignaturePreset}`
                  : "Mode custom (realtime)"}
              </p>
            </label>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Rasio Foto Implant: {implantAspectRatio.toFixed(1)} : 1
              <input
                type="range"
                min={3.0}
                max={4.8}
                step={0.1}
                value={implantAspectRatio}
                onInput={(e) =>
                  handleImplantAspectRatioChange(Number((e.target as HTMLInputElement).value))
                }
                onChange={(e) => handleImplantAspectRatioChange(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {IMPLANT_RATIO_PRESETS.map((preset) => {
                  const isActive = implantAspectRatio === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleImplantAspectRatioChange(preset.value)}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                        isActive
                          ? "border-slate-700 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                {activeImplantRatioPreset
                  ? `Preset aktif: ${activeImplantRatioPreset}`
                  : "Mode custom (realtime)"}
              </p>
            </label>
          </div>
        </section>

        <article className="rounded-2xl border border-slate-400 bg-white p-4 text-slate-900 shadow-sm print:rounded-none print:border-0 print:p-0 dark:border-slate-600 dark:bg-white dark:text-slate-900">
          <div
            className={`mx-auto max-w-[1100px] border border-slate-500 p-4 text-[13px] print:max-w-none print:border print:border-slate-800 ${
              isSingleSheetLayout ? "print:p-2 print:text-[11px]" : ""
            }`}
          >
            <header
              className={`grid grid-cols-[140px_1fr] gap-2 border-b border-slate-400 pb-3 ${
                isSingleSheetLayout ? "print:gap-1 print:pb-1.5" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <div
                  className={`relative h-24 overflow-hidden border border-slate-500 bg-slate-100 print:border-0 ${
                    isSingleSheetLayout ? "print:h-16" : ""
                  }`}
                >
                  <NextImage
                    src="/KBN.png"
                    alt="Logo KBN"
                    fill
                    priority
                    sizes="140px"
                    className="object-contain p-1"
                  />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-center">PT. Karya Bakti Nusindo</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold">Alamat :</p>
                <p className="text-[11px]">Jl. Papan Kencana No. 20 RT.02/RW.06</p>
                <p className="text-[11px]">Kel. Suka Asih, Kec. Bojongloa Kaler</p>
                <p className="text-[11px]">Kota Bandung</p>
                <p className="text-[11px] font-semibold">INDONESIA</p>
              </div>
            </header>

            <h2
              className={`py-3 text-center text-[30px] font-semibold tracking-wide print:text-[20px] ${
                isSingleSheetLayout ? "print:py-1.5 print:text-[16px]" : ""
              }`}
            >
              LEMBAR PEMAKAIAN IMPLANT ZIMMER BIOMET
            </h2>

            <section
              className={`grid grid-cols-1 gap-3 border-t border-slate-400 pt-3 print:gap-1 print:pt-1 md:grid-cols-2 ${
                isSingleSheetLayout ? "print:gap-1 print:pt-1" : ""
              }`}
            >
              <div className={`border border-slate-400 p-2 print:p-1 ${isSingleSheetLayout ? "print:p-1" : ""}`}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:mb-0.5 print:text-[10px]">
                  Keterangan Operasi
                </p>
                {[
                  ["Tanggal Operasi", operationDate, setOperationDate],
                  ["Dokter Bedah", doctorName, setDoctorName],
                  ["Rumah Sakit", hospitalName, setHospitalName],
                  ["Rep Ass", repAssist, setRepAssist],
                  ["System", systemName, setSystemName],
                  ["Di Fakturkan", invoiceTo, setInvoiceTo],
                ].map(([label, value, setter]) => (
                  <label
                    key={String(label)}
                    className="grid grid-cols-[120px_1fr] items-center gap-2 border-b border-dashed border-slate-300 py-1 text-[11px] last:border-b-0 print:gap-1 print:py-0.5 print:text-[9.5px] print:leading-tight"
                  >
                    <span>{String(label)}</span>
                    <input
                      value={String(value)}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500 print:text-[10px] print:leading-tight"
                    />
                  </label>
                ))}
              </div>

              <div className={`border border-slate-400 p-2 print:p-1 ${isSingleSheetLayout ? "print:p-1" : ""}`}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 print:mb-0.5 print:text-[10px]">
                  Keterangan Pasien
                </p>
                <div className="space-y-1 print:space-y-0">
                  {showPatientTextFields ? (
                    <>
                      <label className="grid grid-cols-[110px_1fr] items-center gap-2 border-b border-dashed border-slate-300 py-1 text-[11px] print:gap-1 print:py-0.5 print:text-[9.5px] print:leading-tight">
                        <span>Nama Pasien</span>
                        <input
                          value={patientName}
                          onChange={(e) => handlePatientNameChange(e.target.value)}
                          className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500 print:text-[10px] print:leading-tight"
                        />
                      </label>
                      <label className="grid grid-cols-[110px_1fr] items-center gap-2 border-b border-dashed border-slate-300 py-1 text-[11px] print:gap-1 print:py-0.5 print:text-[9.5px] print:leading-tight">
                        <span>MedRec</span>
                        <input
                          value={medrec}
                          onChange={(e) => handleMedrecChange(e.target.value)}
                          className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500 print:text-[10px] print:leading-tight"
                        />
                      </label>
                    </>
                  ) : null}
                  {showRegionInTopFields ? (
                    <label className="grid grid-cols-[110px_1fr] items-center gap-2 border-b border-dashed border-slate-300 py-1 text-[11px] last:border-b-0 print:gap-1 print:py-0.5 print:text-[9.5px] print:leading-tight">
                      <span>Wilayah</span>
                      <input
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500 print:text-[10px] print:leading-tight"
                      />
                    </label>
                  ) : null}
                </div>
                {showPatientStickerBlock ? (
                  <div className="mt-2 border border-slate-300 p-1.5 print:mt-1 print:p-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 print:text-[9px]">
                      Stiker Identitas Pasien
                    </p>

                    <input
                      ref={patientUploadRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickPatientSticker}
                    />
                    <input
                      ref={patientCameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePickPatientSticker}
                    />

                    {getDisplayImage(patientSticker) ? (
                      <div className="relative mt-1 h-[90px] w-full overflow-hidden rounded border border-slate-300 bg-white print:h-[58px]">
                        <NextImage
                          src={String(getDisplayImage(patientSticker))}
                          alt="Stiker pasien"
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 360px"
                          className="object-contain"
                          style={{ filter: "contrast(1.15) saturate(1.05)", imageRendering: "crisp-edges" }}
                        />
                      </div>
                    ) : (
                      <div className="mt-1 grid h-[90px] place-items-center rounded border border-dashed border-slate-300 text-[10px] text-slate-400 print:h-[58px] print:text-[9px]">
                        Upload / kamera stiker pasien
                      </div>
                    )}

                    {hasPatientSticker ? (
                      <label className="mt-1 grid grid-cols-[58px_1fr] items-center gap-2 border-t border-dashed border-slate-300 pt-1 text-[11px] print:gap-1 print:pt-0.5 print:text-[9.5px]">
                        <span>Wilayah</span>
                        <input
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500 print:text-[10px] print:leading-tight"
                        />
                      </label>
                    ) : null}

                    <div className="mt-1 grid grid-cols-3 gap-1 print:hidden">
                      <button
                        type="button"
                        onClick={() => patientUploadRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1 rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold hover:bg-slate-100"
                      >
                        <FileImage size={11} />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => patientCameraRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1 rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-700 hover:bg-cyan-100"
                      >
                        <Camera size={11} />
                        Kamera
                      </button>
                      <button
                        type="button"
                        onClick={() => setPatientSticker(emptyImage())}
                        className="inline-flex items-center justify-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={11} />
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-700 print:hidden">
                    Mode ketik aktif: kolom stiker pasien disembunyikan.
                  </p>
                )}
              </div>
            </section>

            <section className={`mt-3 space-y-3 ${isSingleSheetLayout ? "print:mt-1.5 print:space-y-1.5" : ""}`}>
              {slotPages.map((page) => (
                <div
                  key={`sheet-page-${page.pageIndex}`}
                  className={
                    page.pageIndex > 0
                      ? "border-t border-dashed border-slate-400 pt-3 print:break-before-page print:border-0 print:pt-0"
                      : ""
                  }
                >
                  {page.pageIndex > 0 ? (
                    <p className="mb-2 text-[11px] font-semibold text-slate-600 print:text-[10px]">
                      Lembar lanjutan {page.pageIndex + 1} dari {estimatedSheetCount}
                    </p>
                  ) : null}

                  <div className={`grid grid-cols-1 gap-2 md:grid-cols-2 ${isSingleSheetLayout ? "print:gap-1.5" : ""}`}>
                    {page.items.map((slot, localIndex) => {
                      const slotIndex = page.start + localIndex;
                      const src = getDisplayImage(slot);
                      const isScanningThisSlot = scanningSlotIndex === slotIndex;
                      const hasImplantMeta = Boolean(
                        slot.implantName.trim() || slot.implantCode.trim()
                      );

                      return (
                        <div
                          key={slot.id}
                          className={`relative min-h-[196px] border border-slate-400 p-2 print:flex print:flex-col ${
                            isSingleSheetLayout ? "print:min-h-[130px] print:p-1.5" : "print:min-h-[170px]"
                          }`}
                        >
                          <input
                            value={slot.label}
                            onChange={(e) => updateSlotLabel(slotIndex, e.target.value)}
                            className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 outline-none print:hidden"
                          />
                          <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                            <input
                              value={slot.implantName}
                              onChange={(e) => updateSlotImplantName(slotIndex, e.target.value)}
                              placeholder="Nama implant"
                              className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 print:hidden"
                            />
                            <input
                              value={slot.implantCode}
                              onChange={(e) => updateSlotImplantCode(slotIndex, e.target.value)}
                              placeholder="REF / LOT / Size"
                              className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-700 outline-none placeholder:text-slate-400 print:hidden"
                            />
                          </div>
                          <div className="hidden print:block print:mt-0.5 print:min-h-[22px] print:space-y-0.5 print:text-[9px] print:leading-tight">
                            {hasImplantMeta ? (
                              <>
                                {slot.implantName.trim() ? (
                                  <p className="print:font-semibold print:text-slate-700">
                                    {slot.implantName.trim()}
                                  </p>
                                ) : null}
                                {slot.implantCode.trim() ? (
                                  <p className="print:text-slate-700">{slot.implantCode.trim()}</p>
                                ) : null}
                              </>
                            ) : (
                              <p className="print:invisible">.</p>
                            )}
                          </div>

                          {src ? (
                            <div
                              className="relative mt-1 w-full overflow-hidden rounded border border-slate-300 bg-white print:mt-0.5"
                              style={{ aspectRatio: `${implantAspectRatio} / 1` }}
                            >
                              <NextImage
                                src={src}
                                alt={slot.label}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 450px"
                                className="object-contain p-1 print:object-contain print:p-0.5"
                                style={{
                                  filter: "contrast(1.15) saturate(1.05)",
                                  imageRendering: "crisp-edges",
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="mt-1 grid w-full place-items-center rounded border border-dashed border-slate-300 text-[11px] text-slate-400 print:mt-0.5 print:text-transparent"
                              style={{ aspectRatio: `${implantAspectRatio} / 1` }}
                            >
                              Tambahkan foto label implant
                            </div>
                          )}

                          <input
                            ref={(el) => {
                              slotUploadRefs.current[slotIndex] = el;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePickSlotFile(slotIndex)}
                          />

                          <input
                            ref={(el) => {
                              slotCameraRefs.current[slotIndex] = el;
                            }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePickSlotFile(slotIndex)}
                          />

                          <div className="mt-2 grid grid-cols-4 gap-1 print:hidden">
                            <button
                              type="button"
                              onClick={() => slotUploadRefs.current[slotIndex]?.click()}
                              className="inline-flex items-center justify-center gap-1 rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold hover:bg-slate-100"
                            >
                              <FileImage size={12} />
                              Upload
                            </button>
                            <button
                              type="button"
                              onClick={() => slotCameraRefs.current[slotIndex]?.click()}
                              className="inline-flex items-center justify-center gap-1 rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700 hover:bg-cyan-100"
                            >
                              <Camera size={12} />
                              Kamera
                            </button>
                            <button
                              type="button"
                              onClick={() => scanLotRefForSlot(slotIndex)}
                              disabled={isScanningThisSlot}
                              className="inline-flex items-center justify-center gap-1 rounded border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                            >
                              <Wand2 size={12} />
                              {isScanningThisSlot ? "Scan..." : "Scan LOT/REF"}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearSlot(slotIndex)}
                              className="inline-flex items-center justify-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              <Trash2 size={12} />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <footer
              className={`mt-4 grid gap-3 border-t border-slate-400 pt-3 text-[12px] transition-all duration-200 ${
                isSingleSheetLayout ? "print:mt-2 print:gap-2 print:pt-1.5" : ""
              }`}
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${signatureMinWidth}px, 1fr))`,
                transition: "grid-template-columns 180ms ease",
              }}
            >
              {signatures.map((item, signatureIndex) => {
                const signatureSrc = getDisplayImage(item);
                const isOrOfficer = item.id === "or";

                return (
                  <div
                    key={item.id}
                    className={`min-h-[136px] border border-slate-400 p-1 text-center transition-all duration-200 print:border-0 ${
                      isSingleSheetLayout ? "print:min-h-[90px] print:p-1" : ""
                    }`}
                  >
                    {isOrOfficer ? (
                      <input
                        value={item.roleLabel}
                        onChange={(e) => updateSignatureLabel(signatureIndex, e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-center text-[12px] font-semibold outline-none print:text-[11px]"
                      />
                    ) : (
                      <p className="font-semibold print:text-[11px] text-center">{item.roleLabel}</p>
                    )}

                    <input
                      ref={(el) => {
                        signatureUploadRefs.current[signatureIndex] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickSignatureFile(signatureIndex)}
                    />
                    <input
                      ref={(el) => {
                        signatureCameraRefs.current[signatureIndex] = el;
                      }}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePickSignatureFile(signatureIndex)}
                    />

                    {signatureSrc ? (
                      <div
                        className={`relative mt-1 h-[62px] w-full text-center overflow-hidden rounded border border-slate-300 bg-white print:border-0 ${
                          isSingleSheetLayout ? "print:h-[46px]" : ""
                        }`}
                      >
                        <NextImage
                          src={signatureSrc}
                          alt={`Tanda tangan ${item.roleLabel}`}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 280px"
                          className="object-contain"
                          style={{ filter: "contrast(1.2) saturate(1.05)", imageRendering: "crisp-edges" }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`mt-1 h-[62px] rounded border border-dashed border-slate-300 print:border-0 ${
                          isSingleSheetLayout ? "print:h-[46px]" : ""
                        }`}
                      />
                    )}

                    <input
                      value={item.personName}
                      onChange={(e) => updateSignatureName(signatureIndex, e.target.value)}
                      className="mt-1 w-full border-0 bg-transparent p-0 text-[12px] text-slate-900 outline-none placeholder:text-slate-500"
                      placeholder="Tanda tangan & nama"
                    />

                    <div className="mt-1 grid grid-cols-4 gap-1 print:hidden">
                      <button
                        type="button"
                        onClick={() => signatureUploadRefs.current[signatureIndex]?.click()}
                        className="inline-flex items-center justify-center gap-1 rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold hover:bg-slate-100"
                      >
                        <FileImage size={11} />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => signatureCameraRefs.current[signatureIndex]?.click()}
                        className="inline-flex items-center justify-center gap-1 rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-[10px] font-semibold text-cyan-700 hover:bg-cyan-100"
                      >
                        <Camera size={11} />
                        Kamera
                      </button>
                      <button
                        type="button"
                        onClick={() => setSigningIndex(signatureIndex)}
                        className="inline-flex items-center justify-center gap-1 rounded border border-indigo-300 bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <PenLine size={11} />
                        Sign
                      </button>
                      <button
                        type="button"
                        onClick={() => clearSignature(signatureIndex)}
                        className="inline-flex items-center justify-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={11} />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </footer>
          </div>
        </article>

        {signingIndex !== null ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 print:hidden">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tanda Tangan Online</p>
                  <p className="text-xs text-slate-500">{currentSigningRole}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSigningIndex(null)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>

              <canvas
                ref={signatureCanvasRef}
                className="h-[220px] w-full touch-none rounded-xl border border-slate-300 bg-white"
                onPointerDown={startDrawing}
                onPointerMove={drawSignature}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
              />

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={clearSignatureCanvas}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Eraser size={13} />
                  Bersihkan
                </button>
                <button
                  type="button"
                  onClick={saveSignatureCanvas}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Check size={13} />
                  Simpan Tanda Tangan
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            background: #fff !important;
          }

          input,
          textarea {
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
          }
        }
      `}</style>
    </div>
  );
}
