/**
 * Normalize a Flow address for comparison.
 * Strips 0x, lowercases, then re-adds 0x.
 */
export function normalizeAddr(addr: string | null | undefined): string {
  if (!addr) return "";
  return "0x" + addr.replace(/^0x/i, "").toLowerCase();
}

/**
 * Compare two Flow addresses, ignoring 0x prefix and case.
 */
export function addrMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeAddr(a) === normalizeAddr(b);
}

/**
 * Formats a number with commas and exactly 2 decimal places.
 * 1000 → "1,000.00", 1000.5 → "1,000.50", 0.1 → "0.10"
 */
export function formatAmount(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Strips everything except digits and one decimal point.
 * Returns clean numeric string for controlled state.
 */
export function parseAmountInput(value: string): string {
  // Strip commas and non-numeric chars except decimal
  const stripped = value.replace(/,/g, "");
  let result = "";
  let hasDecimal = false;
  for (const char of stripped) {
    if (char === "." && !hasDecimal) {
      hasDecimal = true;
      result += char;
    } else if (char >= "0" && char <= "9") {
      result += char;
    }
  }
  return result;
}

/**
 * Formats a raw numeric string with commas for display in an input field.
 * Preserves trailing decimal and trailing zeros after decimal for typing UX.
 * "1000" → "1,000", "1000." → "1,000.", "1000.50" → "1,000.50"
 */
export function formatInputDisplay(raw: string): string {
  if (!raw) return "";
  const parts = raw.split(".");
  const intPart = parts[0];
  if (!intPart && parts.length === 1) return "";

  const formatted = intPart
    ? parseInt(intPart, 10).toLocaleString("en-US")
    : "0";

  if (parts.length === 2) {
    return `${formatted}.${parts[1]}`;
  }
  return formatted;
}
