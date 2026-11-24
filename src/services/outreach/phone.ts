/** Normalise a public phone number for WhatsApp. Do not guess a country unless GH is on file. */
export function toWhatsAppDigits(phone: string | null | undefined, country: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const gh = (country ?? "").toUpperCase() === "GH" || (country ?? "").toLowerCase() === "ghana";
  if (gh) {
    if (digits.startsWith("233") && digits.length >= 12) return digits;
    if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
    if (digits.length === 9) return `233${digits}`;
  }
  if (digits.length >= 10) return digits;
  return null;
}

export function whatsappManualLink(digits: string, text: string) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
