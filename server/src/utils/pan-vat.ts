export type PanVatType = "PAN" | "VAT";

const ENCODE_DELIMITER = "::";
const PAN_VAT_TYPES = new Set<PanVatType>(["PAN", "VAT"]);

const normalizeText = (value: string | null | undefined): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeType = (value: string | null | undefined): PanVatType | null => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return null;
  return PAN_VAT_TYPES.has(normalized as PanVatType) ? (normalized as PanVatType) : null;
};

export const parsePanVatFromStored = (
  storedValue: string | null | undefined
): { panVatType: PanVatType | null; panVatNo: string | null } => {
  const raw = normalizeText(storedValue);
  if (!raw) {
    return { panVatType: null, panVatNo: null };
  }

  const encodedMatch = raw.match(/^([A-Za-z]+)::(.+)$/);
  if (encodedMatch) {
    const parsedType = normalizeType(encodedMatch[1]);
    const parsedNo = normalizeText(encodedMatch[2]);
    if (parsedType && parsedNo) {
      return { panVatType: parsedType, panVatNo: parsedNo };
    }
  }

  const labelledMatch = raw.match(/^(PAN|VAT)\s*[:\-]\s*(.+)$/i);
  if (labelledMatch) {
    const parsedType = normalizeType(labelledMatch[1]);
    const parsedNo = normalizeText(labelledMatch[2]);
    if (parsedType && parsedNo) {
      return { panVatType: parsedType, panVatNo: parsedNo };
    }
  }

  return { panVatType: null, panVatNo: raw };
};

export const normalizePanVatNoForStorage = (
  panVatNo: string | null | undefined,
  panVatType: string | null | undefined
): string | null => {
  const normalizedNo = normalizeText(panVatNo);
  if (!normalizedNo) return null;

  const parsedFromNo = parsePanVatFromStored(normalizedNo);
  const chosenType = normalizeType(panVatType) ?? parsedFromNo.panVatType;
  const chosenNo = parsedFromNo.panVatNo ?? normalizedNo;

  if (!chosenNo) return null;
  if (!chosenType) return chosenNo;

  return `${chosenType}${ENCODE_DELIMITER}${chosenNo}`;
};

export const formatPanVatForDisplay = (storedValue: string | null | undefined): string | null => {
  const { panVatType, panVatNo } = parsePanVatFromStored(storedValue);
  if (!panVatNo) return null;
  return panVatType ? `${panVatType}: ${panVatNo}` : panVatNo;
};
