const NG_MOBILE_PREFIXES = [
  '070', '071', '080', '081', '090', '091',
];

export function normalizeNigerianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }
  if (digits.length === 10 && NG_MOBILE_PREFIXES.some((p) => ('0' + digits).startsWith(p))) {
    return '0' + digits;
  }
  return digits;
}

export function isValidNigerianPhone(raw) {
  if (!raw) return false;
  const normalized = normalizeNigerianPhone(raw);
  if (normalized.length !== 11) return false;
  return NG_MOBILE_PREFIXES.some((p) => normalized.startsWith(p));
}

export function formatNigerianPhoneDisplay(raw) {
  const normalized = normalizeNigerianPhone(raw);
  if (!normalized) return '';
  return normalized.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
}

export function toInternationalFormat(raw) {
  const normalized = normalizeNigerianPhone(raw);
  if (!normalized) return '';
  return '234' + normalized.slice(1);
}
