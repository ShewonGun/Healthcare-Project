import twilio from 'twilio';

/**
 * Send an SMS notification via Twilio.
 * @param {string} to   - E.164 phone number e.g. +1234567890
 * @param {string} body - SMS text body
 * @returns {{ success: boolean, error?: string }}
 */
export const sendSMS = async (to, body) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.warn('[SMSService] Twilio credentials not set — skipping SMS');
      return { success: false, error: 'Twilio credentials not configured' };
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ body, from, to });
    
    return { success: true };
  } catch (error) {
    const detail = error.message || String(error);
    console.error(`[SMSService] Failed to send SMS to ${to}: ${detail}`);
    return { success: false, error: detail };
  }
};

//SMS message templates 

export const appointmentBookedSMS = ({ recipientName, doctorName, date, time }) =>
  `Hi ${recipientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} has been booked. - Healthcare Platform`;

export const appointmentConfirmedSMS = ({ recipientName, doctorName, date, time }) =>
  `Hi ${recipientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} has been CONFIRMED. - Healthcare Platform`;

export const appointmentCancelledSMS = ({ recipientName, doctorName, date, time }) =>
  `Hi ${recipientName}, your appointment with Dr. ${doctorName} on ${date} at ${time} has been CANCELLED. Please rebook if needed. - Healthcare Platform`;

export const appointmentCompletedSMS = ({ recipientName, doctorName }) =>
  `Hi ${recipientName}, your appointment with Dr. ${doctorName} has been completed. Thank you for using Healthcare Platform.`;

export const consultationCompletedSMS = ({ recipientName, doctorName, durationMinutes }) =>
  `Hi ${recipientName}, your video consultation with Dr. ${doctorName}${durationMinutes ? ` (${durationMinutes} min)` : ''} has been completed. - Healthcare Platform`;
