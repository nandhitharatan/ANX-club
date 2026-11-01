/**
 * Virtual Email Dispatch Service
 * Note: Resend email dependency removed per project specifications.
 * All notification dispatches are routed virtually and surfaced via the In-App notification center.
 */
export const sendEmail = async (to: string, subject: string, html: string, attachments?: any[]) => {
  console.log(`\n📨 [EMAIL DISPATCH] -> To: ${to} | Subject: "${subject}" (Virtual Delivery)`);
  return {
    id: `email_${Date.now()}`,
    to,
    subject,
    status: 'sent',
    virtual: true,
  };
};
