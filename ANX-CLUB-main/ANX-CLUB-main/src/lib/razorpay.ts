export const createRazorpayOrder = async (amount: number, currency: string = "INR", extraData: any = {}) => {
  const response = await fetch('/api/v1/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, ...extraData }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create Razorpay order');
  }

  return response.json();
};

export const verifyRazorpayPayment = async (
  paymentResponse: any, 
  userId?: string,
  userEmail?: string,
  amount?: number,
  paymentType?: string
) => {
  const response = await fetch('/api/v1/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...paymentResponse,
      userId,
      userEmail,
      amount,
      paymentType
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Payment verification failed');
  }

  return response.json();
};
