/**
 * Email templates for various transactional events.
 * Using basic HTML structure. Can be upgraded to React Email later.
 */

export const signupWelcomeEmail = (name: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to our Community, ${name}!</h2>
    <p>We are thrilled to have you onboard.</p>
    <p>Get started by exploring our events and connecting with mentors.</p>
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const eventRegistrationEmail = (eventName: string, userName: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Event Registration Confirmed</h2>
    <p>Hi ${userName},</p>
    <p>You have successfully registered for <strong>${eventName}</strong>.</p>
    <p>We look forward to seeing you there!</p>
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const paymentConfirmationEmail = (amount: number, orderId: string, itemType: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Payment Confirmation</h2>
    <p>Thank you for your payment.</p>
    <p><strong>Item:</strong> ${itemType}</p>
    <p><strong>Amount:</strong> ₹${amount}</p>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p>Your transaction was successful.</p>
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const mentorBookingRequestEmail = (mentorName: string, date: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Mentor Session Requested</h2>
    <p>Your request for a mentoring session with <strong>${mentorName}</strong> on ${date} has been sent.</p>
    <p>We will notify you once the mentor approves or rejects the request.</p>
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const mentorBookingApprovalEmail = (mentorName: string, date: string, status: 'approved' | 'rejected', meetingLink?: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Mentor Session Update</h2>
    <p>Your mentoring session with <strong>${mentorName}</strong> on ${date} has been <strong>${status}</strong>.</p>
    ${status === 'approved' ? `<p>Please check your calendar for the meeting link, or join here: <a href="${meetingLink}">Join Video Call</a></p>` : '<p>We are sorry, but the mentor is unavailable at this time.</p>'}
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const membershipActivationEmail = (userName: string, expiryDate: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Premium Membership Activated!</h2>
    <p>Hi ${userName},</p>
    <p>Congratulations! Your Premium Membership is now active.</p>
    <p>Your membership is valid until: ${new Date(expiryDate).toLocaleDateString()}</p>
    <p>Enjoy all the exclusive benefits!</p>
    <br/>
    <p>Best,<br/>The Team</p>
  </div>
`;

export const generateICS = (mentorName: string, date: string, time: string, topic: string, meetingLink?: string) => {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  
  const startStr = `${year}${month}${day}T${hours}${minutes}00`;
  const endHour = String((parseInt(hours, 10) + 1) % 24).padStart(2, '0');
  const endStr = `${year}${month}${day}T${endHour}${minutes}00`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MentorshipPlatform//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${new Date().getTime()}@mentorshipplatform.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:Mentorship Session with ${mentorName} - ${topic}
DESCRIPTION:Your mentorship session. Join here: ${meetingLink || 'TBD'}
LOCATION:${meetingLink || 'Google Meet / Zoom (Link TBD)'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
};
