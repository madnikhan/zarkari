const otpStore = new Map<string, { code: string; expires: number; orderId: string }>();

export function generateOtp(orderNumber: string, orderId: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(orderNumber, { code, expires: Date.now() + 10 * 60 * 1000, orderId });
  return code;
}

export function verifyOtp(orderNumber: string, code: string): string | null {
  const entry = otpStore.get(orderNumber);
  if (!entry || entry.expires < Date.now() || entry.code !== code) return null;
  otpStore.delete(orderNumber);
  return entry.orderId;
}
