// India-specific identifiers: pincodes, GST state codes and GSTINs.

/** GST state and union-territory codes (the first two digits of a GSTIN). */
export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

export type StateCode = keyof typeof GST_STATES & string;

const normalizeName = (name: string) =>
  name.toLowerCase().replaceAll("&", "and").replace(/[^a-z]/g, "");

/** "Tamil Nadu", "TAMIL NADU", "tamil-nadu" → "33". Undefined if unknown. */
export function stateCodeFor(stateName: string): string | undefined {
  const wanted = normalizeName(stateName);
  return Object.keys(GST_STATES).find((code) => normalizeName(GST_STATES[code]!) === wanted);
}

export function isStateCode(value: string): boolean {
  return value in GST_STATES;
}

/** Indian pincodes: 6 digits, not starting with 0. */
export function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value.trim());
}

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The 15th character of a GSTIN, computed from the first 14 (mod-36 checksum). */
export function gstinCheckCharacter(first14: string): string {
  let total = 0;
  for (let i = 0; i < 14; i++) {
    const value = GSTIN_CHARS.indexOf(first14[i]!);
    const product = value * (i % 2 === 0 ? 1 : 2);
    total += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (total % 36)) % 36]!;
}

/**
 * Checks a GSTIN's shape (state code + PAN + entity + Z + checksum) and its
 * check character. It doesn't prove the GSTIN is active: that needs a lookup
 * on the GST portal.
 */
export function validateGstin(raw: string): { ok: true; gstin: string; stateCode: string } | { ok: false; reason: string } {
  const gstin = raw.trim().toUpperCase();
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return { ok: false, reason: "A GSTIN has 15 characters, like 33ABCDE1234F1Z5." };
  }
  const stateCode = gstin.slice(0, 2);
  if (!isStateCode(stateCode)) return { ok: false, reason: "The first two digits aren't a valid state code." };
  if (gstinCheckCharacter(gstin.slice(0, 14)) !== gstin[14]) {
    return { ok: false, reason: "This GSTIN has a typo: its last character doesn't match." };
  }
  return { ok: true, gstin, stateCode };
}
