export type PayoutMethod = "" | "fastpay" | "zaincash" | "qi_card" | "fib";

/** Strip all non-digits; preserve leading + so we can recognise country code. */
const digits = (s: string) => s.replace(/[^\d]/g, "");

/**
 * Iraqi mobile numbers — used by FastPay, ZainCash, FIB wallets.
 * Accepts:  +9647XXXXXXXXX  |  009647XXXXXXXXX  |  07XXXXXXXXX
 * Mobile prefix after country/leading-zero must be 7, followed by 9 digits.
 * Valid Iraqi mobile operator second digit is 0,3,4,5,7,8,9.
 */
export const validateIraqiPhone = (raw: string): string | null => {
  const d = digits(raw);
  if (!d) return "Phone number is required";
  let local = d;
  if (local.startsWith("00964")) local = local.slice(5);
  else if (local.startsWith("964")) local = local.slice(3);
  else if (local.startsWith("0")) local = local.slice(1);
  if (!/^7[03-57-9]\d{8}$/.test(local)) {
    return "Enter a valid Iraqi mobile number (e.g. +964 7XX XXX XXXX)";
  }
  return null;
};

/** Qi Card number — 16 digits, Luhn-checked. */
export const validateQiCard = (raw: string): string | null => {
  const d = digits(raw);
  if (!d) return "Qi Card number is required";
  if (d.length !== 16) return "Qi Card number must be 16 digits";
  // Luhn checksum
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  if (sum % 10 !== 0) return "Qi Card number is invalid (checksum failed)";
  return null;
};

/** Account holder full name — at least first + last, letters/spaces/hyphens/apostrophes. */
export const validateAccountName = (raw: string): string | null => {
  const v = raw.trim();
  if (!v) return "Account holder name is required";
  if (v.length < 3) return "Name is too short";
  if (!/^[\p{L}][\p{L}\s.'-]{1,}$/u.test(v)) {
    return "Name can only contain letters, spaces, hyphens and apostrophes";
  }
  if (!/\s/.test(v)) return "Enter your full name (first and last)";
  return null;
};

export interface PayoutErrors {
  accountName?: string;
  phone?: string;
  accountNumber?: string;
}

export const validatePayoutDetails = (params: {
  method: PayoutMethod;
  accountName: string;
  phone: string;
  accountNumber: string;
}): PayoutErrors => {
  const errors: PayoutErrors = {};
  if (!params.method) return errors;

  const nameErr = validateAccountName(params.accountName);
  if (nameErr) errors.accountName = nameErr;

  if (params.method === "fastpay" || params.method === "zaincash" || params.method === "fib") {
    const phoneErr = validateIraqiPhone(params.phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  if (params.method === "qi_card") {
    const cardErr = validateQiCard(params.accountNumber);
    if (cardErr) errors.accountNumber = cardErr;
  }

  return errors;
};

export const isPayoutValid = (errors: PayoutErrors) =>
  Object.keys(errors).length === 0;
