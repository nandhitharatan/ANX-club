/**
 * Email templates for various transactional events.
 * Using responsive modern HTML layout with Dark Theme branding.
 */

export const signupWelcomeEmail = (name: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #a855f7; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">A.N.X PLATFORM</h1>
      <p style="color: #9ca3af; font-size: 13px; text-transform: uppercase; tracking: 2px; margin-top: 4px;">Club & Member Ecosystem</p>
    </div>
    
    <div style="background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #374151;">
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome to the Community, ${name}! 🚀</h2>
      <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">We are thrilled to welcome you to the ANX Member Ecosystem. You now have access to tech events, 1-on-1 expert mentors, verified career roadmaps, and project incubation.</p>
      
      <div style="margin: 24px 0; padding: 16px; background: rgba(168, 85, 247, 0.1); border-left: 4px solid #a855f7; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #e9d5ff;"><strong>Quick Start:</strong> Explore upcoming hackathons, book a mentor session, or start an AI/Web3 roadmap to earn your first XP badge!</p>
      </div>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px;">© ${new Date().getFullYear()} A.N.X Ecosystem. All rights reserved.</p>
  </div>
`;

export const eventRegistrationEmail = (eventName: string, userName: string, date?: string, time?: string, venue?: string, meetingLink?: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; letter-spacing: 1px;">Registration Confirmed</div>
      <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">${eventName}</h1>
    </div>
    
    <div style="background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #374151;">
      <p style="color: #d1d5db; font-size: 14px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
      <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your seat has been officially reserved for this upcoming session! <strong>+50 XP</strong> has been credited to your profile leaderboard.</p>
      
      <div style="background: #1f2937; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e5e7eb;">
          ${date ? `<tr><td style="padding: 6px 0; color: #9ca3af;">📅 Date:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${date}</td></tr>` : ''}
          ${time ? `<tr><td style="padding: 6px 0; color: #9ca3af;">⏰ Time:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${time}</td></tr>` : ''}
          ${venue ? `<tr><td style="padding: 6px 0; color: #9ca3af;">📍 Location:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${venue}</td></tr>` : ''}
        </table>
      </div>

      ${meetingLink ? `
      <div style="text-align: center; margin-top: 24px;">
        <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px;">Join Live Room</a>
      </div>
      ` : ''}
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px;">Need help? Reach out to support@anxplatform.com</p>
  </div>
`;

export interface PaidTicketEmailProps {
  eventName: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  venue: string;
  ticketId: string;
  seatNumber: string;
  amount: number;
  qrCodeUrl: string;
  meetingLink?: string;
}

export const paidEventTicketEmail = ({
  eventName,
  userName,
  userEmail,
  date,
  time,
  venue,
  ticketId,
  seatNumber,
  amount,
  qrCodeUrl,
  meetingLink
}: PaidTicketEmailProps) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px; letter-spacing: 1px;">Official VIP Event Pass</div>
      <h1 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 24px; font-weight: 800;">${eventName}</h1>
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">Payment Verified • Admission Ticket</p>
    </div>
    
    <!-- TICKET CONTAINER -->
    <div style="background: linear-gradient(180deg, #182234 0%, #0f172a 100%); border-radius: 16px; border: 2px dashed #475569; padding: 24px; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      
      <!-- Top Ticket Header -->
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between;">
        <div>
          <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Attendee Name</span>
          <h3 style="margin: 2px 0 0 0; color: #ffffff; font-size: 16px;">${userName}</h3>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Seat Assignment</span>
          <h3 style="margin: 2px 0 0 0; color: #38bdf8; font-size: 16px;">${seatNumber}</h3>
        </div>
      </div>

      <!-- Ticket Details Grid -->
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">📅 Date & Time:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; text-align: right;">${date} @ ${time}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">📍 Venue:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 600; text-align: right;">${venue}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">🎟️ Pass Type:</td>
          <td style="padding: 6px 0; color: #a855f7; font-weight: 600; text-align: right;">Full Access Pass</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">💳 Paid Amount:</td>
          <td style="padding: 6px 0; color: #10b981; font-weight: 700; text-align: right;">₹${amount} (PAID)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">🆔 Ticket ID:</td>
          <td style="padding: 6px 0; color: #f59e0b; font-family: monospace; font-weight: 700; text-align: right;">${ticketId}</td>
        </tr>
      </table>

      <!-- QR CODE ENTRY PASS -->
      <div style="text-align: center; padding: 18px; background: #ffffff; border-radius: 12px; margin: 16px auto; max-width: 220px;">
        <img src="${qrCodeUrl}" alt="Event Ticket QR Code" style="width: 180px; height: 180px; display: block; margin: 0 auto;" />
        <p style="margin: 8px 0 0 0; color: #0f172a; font-size: 10px; font-weight: 800; letter-spacing: 1px; font-family: monospace;">SCAN AT VENUE ENTRANCE</p>
      </div>

      ${meetingLink ? `
      <div style="text-align: center; margin-top: 16px;">
        <a href="${meetingLink}" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px;">Open Virtual Live Stream Link</a>
      </div>
      ` : ''}

    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px;">Present this digital ticket or QR pass upon entry. <strong>+50 XP</strong> has been added to your profile!</p>
  </div>
`;

export interface MentorScheduledEmailProps {
  mentorName: string;
  userName: string;
  date: string;
  time: string;
  topic: string;
  meetingLink: string;
  isPaid?: boolean;
  amount?: number;
}

export const mentorSessionScheduledEmail = ({
  mentorName,
  userName,
  date,
  time,
  topic,
  meetingLink,
  isPaid,
  amount
}: MentorScheduledEmailProps) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background: #8b5cf6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; letter-spacing: 1px;">Session Scheduled & Confirmed</div>
      <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">1-on-1 Mentorship Session</h1>
      <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0 0;">with <strong>${mentorName}</strong></p>
    </div>
    
    <div style="background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #374151;">
      <p style="color: #d1d5db; font-size: 14px; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
      <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your 1-on-1 mentorship session has been scheduled according to your selected slot timing. <strong>+40 XP</strong> has been awarded to your account!</p>
      
      <div style="background: #1f2937; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e5e7eb;">
          <tr><td style="padding: 6px 0; color: #9ca3af;">👨‍💼 Mentor:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${mentorName}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">📅 Slot Date:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${date}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">⏰ Slot Timing:</td><td style="padding: 6px 0; font-weight: 700; color: #38bdf8; text-align: right;">${time}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">🎯 Discussion Topic:</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${topic}</td></tr>
          ${isPaid && amount ? `<tr><td style="padding: 6px 0; color: #9ca3af;">💳 Fee Paid:</td><td style="padding: 6px 0; font-weight: 700; color: #10b981; text-align: right;">₹${amount}</td></tr>` : ''}
        </table>
      </div>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">Join Google Meet Video Room</a>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 8px;">Direct Link: <a href="${meetingLink}" style="color: #38bdf8;">${meetingLink}</a></p>
      </div>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 24px;">Please be ready 5 minutes prior to your scheduled slot. Best of luck with your session!</p>
  </div>
`;

export const mentorBookingRequestEmail = (mentorName: string, date: string, time?: string, topic?: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <h2 style="color: #ffffff; margin-top: 0;">Mentorship Session Requested</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your session request with <strong>${mentorName}</strong> on <strong>${date}</strong>${time ? ` at <strong>${time}</strong>` : ''} has been registered.</p>
    ${topic ? `<p style="color: #9ca3af; font-size: 13px;">Topic: ${topic}</p>` : ''}
    <p style="color: #d1d5db; font-size: 14px;">You will receive your meeting link prior to the slot time. <strong>+40 XP</strong> awarded!</p>
  </div>
`;

export const mentorBookingApprovalEmail = (mentorName: string, date: string, time?: string, meetingLink?: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <div style="display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; letter-spacing: 1px;">Session Approved</div>
    <h2 style="color: #ffffff; margin-top: 12px;">Mentorship Confirmed with ${mentorName}</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your 1-on-1 session on <strong>${date}</strong>${time ? ` at <strong>${time}</strong>` : ''} has been approved by the mentor.</p>
    ${meetingLink ? `
      <div style="margin: 20px 0; text-align: center;">
        <a href="${meetingLink}" style="display: inline-block; background: #8b5cf6; color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px;">Join Google Meet</a>
      </div>
    ` : ''}
  </div>
`;

export const mentorBookingRejectionEmail = (mentorName: string, reason?: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <h2 style="color: #ef4444; margin-top: 0;">Mentorship Session Update</h2>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Your booking request with <strong>${mentorName}</strong> could not be scheduled at this time.</p>
    ${reason ? `<p style="color: #9ca3af; font-size: 13px;">Reason: ${reason}</p>` : ''}
    <p style="color: #d1d5db; font-size: 14px;">Please feel free to choose another available slot or connect with another mentor.</p>
  </div>
`;

export const paymentConfirmationEmail = (amount: number, orderId: string, itemType: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <h2 style="color: #10b981; margin-top: 0;">Payment Confirmation Receipt</h2>
    <p style="color: #d1d5db; font-size: 14px;">Thank you for your transaction.</p>
    <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151; margin: 16px 0;">
      <p style="margin: 4px 0; color: #e5e7eb; font-size: 13px;"><strong>Item / Service:</strong> ${itemType}</p>
      <p style="margin: 4px 0; color: #e5e7eb; font-size: 13px;"><strong>Amount Paid:</strong> ₹${amount}</p>
      <p style="margin: 4px 0; color: #e5e7eb; font-size: 13px;"><strong>Transaction ID:</strong> ${orderId}</p>
    </div>
  </div>
`;

export const membershipActivationEmail = (userName: string, expiryDate: string, planName?: string) => `
  <div style="background-color: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; border: 1px solid #1f2937;">
    <h2 style="color: #f59e0b; margin-top: 0;">👑 ${planName || 'Premium'} Elite Membership Activated!</h2>
    <p style="color: #d1d5db; font-size: 14px;">Hi ${userName},</p>
    <p style="color: #d1d5db; font-size: 14px; line-height: 1.6;">Congratulations! Your ${planName || 'Premium'} Membership is now active through ${new Date(expiryDate).toLocaleDateString()}.</p>
    <p style="color: #d1d5db; font-size: 14px;">You now have unrestricted VIP access to all premium events, 1-on-1 mentorship bookings, capstone roadmaps, and priority incubation.</p>
  </div>
`;

export const generateICS = (mentorName: string, date: string, time: string, topic: string, meetingLink?: string) => {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.includes(':') ? time.split(':') : ['10', '00'];
  
  const startStr = `${year}${month}${day}T${hours.padStart(2, '0')}${minutes.slice(0, 2)}00`;
  const endHour = String((parseInt(hours, 10) + 1) % 24).padStart(2, '0');
  const endStr = `${year}${month}${day}T${endHour}${minutes.slice(0, 2)}00`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ANXPlatform//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${new Date().getTime()}@anxplatform.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:Mentorship Session with ${mentorName} - ${topic}
DESCRIPTION:Your mentorship session. Join here: ${meetingLink || 'TBD'}
LOCATION:${meetingLink || 'Google Meet'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
};

