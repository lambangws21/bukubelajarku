const CUP_SIZES = [44, 46, 48, 50, 52, 54];

type Props = {
  size: number;
  onChange: (v: number) => void;
};

export function CupSizeSelector({ size, onChange }: Props) {
  return (
    <div className="flex gap-2 bg-white p-2 rounded-xl shadow">
      {CUP_SIZES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`
            px-3 py-1 rounded-lg text-sm font-medium
            ${s === size
              ? "bg-blue-600 text-white"
              : "bg-gray-100 hover:bg-gray-200"}
          `}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
