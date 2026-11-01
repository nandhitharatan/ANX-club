export async function sendSMS({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      const data = await client.messages.create({
        body: message,
        from: fromNumber,
        to,
      });
      return { success: true, data };
    } catch (error: any) {
      console.error("Failed to send Twilio SMS:", error);
      return { success: false, error: error.message };
    }
  } else {
    console.log(`[Mock SMS Log] Sent SMS to ${to}: "${message}"`);
    return { success: true, mock: true };
  }
}
