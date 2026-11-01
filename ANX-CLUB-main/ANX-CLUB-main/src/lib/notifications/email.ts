/**
 * Virtual Email Dispatch Helper
 * Resend dependency removed. Dispatches are captured virtually.
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  [key: string]: any;
}) {
  console.log(`ℹ️ [EMAIL DISPATCH] Virtual email to:`, options.to, `Subject:`, options.subject);
  return { success: true, message: "Email dispatched virtually." };
}
