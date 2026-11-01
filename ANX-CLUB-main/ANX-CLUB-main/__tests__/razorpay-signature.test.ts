import crypto from 'crypto';

describe('Razorpay Signature Verification Security', () => {
  const secret = 'test_secret_key_12345';
  const orderId = 'order_DA76823490';
  const paymentId = 'pay_9823471092';

  function generateValidSignature(orderId: string, paymentId: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  function verifySignatureTimingSafe(orderId: string, paymentId: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const providedBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  it('should validate matching HMAC SHA256 signatures successfully', () => {
    const signature = generateValidSignature(orderId, paymentId, secret);
    const isValid = verifySignatureTimingSafe(orderId, paymentId, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject tampered payment ID or order ID', () => {
    const signature = generateValidSignature(orderId, paymentId, secret);
    const isValid = verifySignatureTimingSafe('order_TAMPERED', paymentId, signature, secret);
    expect(isValid).toBe(false);
  });

  it('should reject forged or mismatched signatures of different length', () => {
    const isValid = verifySignatureTimingSafe(orderId, paymentId, 'short_forged_sig', secret);
    expect(isValid).toBe(false);
  });

  it('should reject signatures created with wrong secret', () => {
    const signature = generateValidSignature(orderId, paymentId, 'wrong_secret');
    const isValid = verifySignatureTimingSafe(orderId, paymentId, signature, secret);
    expect(isValid).toBe(false);
  });
});
