/**
 * Module 3 Virtual Email Service
 * Resend dependency removed.
 */
export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
  console.log(`ℹ️ [EMAIL DISPATCH] Virtual email to: ${to} | Subject: ${subject}`);
  return { id: `email_${Date.now()}`, to, subject, status: 'sent', virtual: true };
};
