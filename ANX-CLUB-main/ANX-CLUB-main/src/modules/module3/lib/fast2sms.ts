export const sendOTP = async (phoneNumber: string, otp: string) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error('Fast2SMS API key is missing');
  }

  const url = 'https://www.fast2sms.com/dev/bulkV2';
  
  const params = new URLSearchParams({
    authorization: apiKey,
    message: `Your verification OTP is ${otp}. Please do not share it with anyone.`,
    language: 'english',
    route: 'q',
    numbers: phoneNumber,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'cache-control': 'no-cache'
    }
  });

  const data = await response.json();

  if (!response.ok || !data.return) {
    throw new Error(data.message || 'Failed to send OTP via Fast2SMS');
  }

  return data;
};
