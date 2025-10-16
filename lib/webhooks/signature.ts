import crypto from "crypto"

export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}
