/** Normalises a phone number to WhatsApp's digits-only international format. */
export function normalizePhone(raw: string, defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE ?? "91") {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = defaultCountryCode + digits.slice(1);
  else if (digits.length === 10) digits = defaultCountryCode + digits;
  digits = digits.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function formatPhone(digits: string) {
  if (digits.startsWith("91") && digits.length === 12) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return `+${digits}`;
}
