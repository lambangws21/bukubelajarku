// utils/formatName.ts
export const formatNameFromEmail = (email: string): string => {
    const localPart = email.split("@")[0]; // ambil sebelum @
    return localPart
      .split(/[.\-_]/) // pisah pakai titik / strip
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };
  