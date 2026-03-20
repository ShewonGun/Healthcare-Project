import twilio from 'twilio';

const SINGLE_SMS_LIMIT = 160;

// Convert local Sri Lankan numbers to E.164 for Twilio
const normalizeToE164 = (raw) => {
  if (!raw) return '';

  const cleaned = String(raw).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+94${cleaned.slice(1)}`;

  return cleaned;
};

const singleSegmentText = (text) => {
  if (!text) return '';
  const compact = String(text).replace(/\s+/g, ' ').trim();
  if (compact.length <= SINGLE_SMS_LIMIT) return compact;
  return `${compact.slice(0, SINGLE_SMS_LIMIT - 3)}...`;
};

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
    const normalizedTo = normalizeToE164(to);
    const smsBody = singleSegmentText(body);

    if (!accountSid || !authToken || !from) {
      console.warn('[SMSService] Twilio credentials not set — skipping SMS');
      return { success: false, error: 'Twilio credentials not configured' };
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ body: smsBody, from, to: normalizedTo });
    
    return { success: true };
  } catch (error) {
    const detail = error.message || String(error);
    console.error(`[SMSService] Failed to send SMS to ${to}: ${detail}`);
    return { success: false, error: detail };
  }
};

//SMS message templates 

export const appointmentBookedSMS = ({ recipientName, doctorName, date, time }) =>
  singleSegmentText(`HCP: Hi ${recipientName}, appt booked with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentConfirmedSMS = ({ recipientName, doctorName, date, time }) =>
  singleSegmentText(`HCP: Hi ${recipientName}, appt confirmed with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentCancelledSMS = ({ recipientName, doctorName, date, time }) =>
  singleSegmentText(`HCP: Hi ${recipientName}, appt with Dr. ${doctorName} on ${date} at ${time} was cancelled. Please rebook.`);

export const appointmentCompletedSMS = ({ recipientName, doctorName }) =>
  singleSegmentText(`HCP: Hi ${recipientName}, your appointment with Dr. ${doctorName} is completed.`);

export const consultationCompletedSMS = ({ recipientName, doctorName, durationMinutes }) =>
  singleSegmentText(`HCP: Hi ${recipientName}, video consultation with Dr. ${doctorName}${durationMinutes ? ` (${durationMinutes} min)` : ''} is completed.`);
