import axios from 'axios';

const MAX_WHATSAPP_TEXT_LENGTH = 1000;

// Convert local Sri Lankan numbers to international digits-only format for WhatsApp Cloud API.
const normalizeToWhatsAppId = (raw) => {
  if (!raw) return '';

  const cleaned = String(raw).replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('94')) return cleaned;
  if (cleaned.startsWith('0')) return `94${cleaned.slice(1)}`;

  return cleaned.replace(/^\+/, '');
};

const normalizeMessageText = (text) => {
  if (!text) return '';
  const compact = String(text).replace(/\s+/g, ' ').trim();
  if (compact.length <= MAX_WHATSAPP_TEXT_LENGTH) return compact;
  return `${compact.slice(0, MAX_WHATSAPP_TEXT_LENGTH - 3)}...`;
};

/**
 * Send a WhatsApp notification via Meta Cloud API.
 * @param {string} to   - International phone number, with or without '+'
 * @param {string} body - Message text body
 * @param {{ templateName?: string, templateParams?: string[] }} [options]
 * @returns {{ success: boolean, error?: string }}
 */
export const sendWhatsApp = async (to, body, options = {}) => {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v25.0';
    const defaultTemplateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG || 'en_US';
    const forceTemplate = process.env.WHATSAPP_FORCE_TEMPLATE === 'true';
    const fallbackTemplateName = process.env.WHATSAPP_FALLBACK_TEMPLATE_NAME || '';
    const runtimeTemplateName = (options.templateName || '').trim();
    const runtimeTemplateParams = Array.isArray(options.templateParams)
      ? options.templateParams.map((value) => String(value ?? ''))
      : [];
    const normalizedTo = normalizeToWhatsAppId(to);
    const whatsappBody = normalizeMessageText(body);

    if (!accessToken || !phoneNumberId) {
      console.warn('[WhatsAppService] WhatsApp credentials not set - skipping notification');
      return { success: false, error: 'WhatsApp credentials not configured' };
    }

    if (!normalizedTo) {
      return { success: false, error: 'Recipient phone number is invalid' };
    }

    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const templatePayload = (name, params = []) => {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'template',
        template: {
          name,
          language: { code: templateLanguage },
        },
      };

      if (params.length) {
        payload.template.components = [
          {
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          },
        ];
      }

      return payload;
    };

    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedTo,
      type: 'text',
      text: { preview_url: false, body: whatsappBody },
    };

    const callWhatsApp = async (payload) => axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const preferredTemplateName = runtimeTemplateName || defaultTemplateName || '';

    const sendTemplateWithFallback = async (name, params = []) => {
      try {
        await callWhatsApp(templatePayload(name, params));
        return { success: true };
      } catch (templateError) {
        if (!fallbackTemplateName || name === fallbackTemplateName) {
          throw templateError;
        }
        console.warn(`[WhatsAppService] Template ${name} failed, retrying with fallback: ${fallbackTemplateName}`);
        await callWhatsApp(templatePayload(fallbackTemplateName));
        return { success: true };
      }
    };

    if (forceTemplate) {
      const forcedTemplate = preferredTemplateName || fallbackTemplateName;
      if (!forcedTemplate) {
        return { success: false, error: 'Template mode enabled but no template is configured' };
      }
      return await sendTemplateWithFallback(forcedTemplate, runtimeTemplateParams);
    }

    if (preferredTemplateName) {
      return await sendTemplateWithFallback(preferredTemplateName, runtimeTemplateParams);
    }

    try {
      await callWhatsApp(textPayload);
      return { success: true };
    } catch (textError) {
      // On test numbers or outside the 24-hour window, Cloud API can reject free-form text.
      if (!fallbackTemplateName) {
        throw textError;
      }
      console.warn(`[WhatsAppService] Text message blocked, retrying with template: ${fallbackTemplateName}`);
      await callWhatsApp(templatePayload(fallbackTemplateName));
      return { success: true };
    }

  } catch (error) {
    const graphError = error.response?.data?.error;
    const detail = graphError
      ? `${graphError.message} (code: ${graphError.code || 'n/a'}, subcode: ${graphError.error_subcode || 'n/a'})`
      : (error.message || String(error));
    console.error(`[WhatsAppService] Failed to send message to ${to}: ${detail}`);
    return { success: false, error: detail };
  }
};

// Backward-compatible alias: existing controller code can still call sendSMS.
export const sendSMS = sendWhatsApp;

// WhatsApp message templates

export const appointmentBookedWhatsApp = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`HCP: Hi ${recipientName}, appt booked with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentConfirmedWhatsApp = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`HCP: Hi ${recipientName}, appt confirmed with Dr. ${doctorName} on ${date} at ${time}.`);

export const appointmentCancelledWhatsApp = ({ recipientName, doctorName, date, time }) =>
  normalizeMessageText(`HCP: Hi ${recipientName}, appt with Dr. ${doctorName} on ${date} at ${time} was cancelled. Please rebook.`);

export const appointmentCompletedWhatsApp = ({ recipientName, doctorName }) =>
  normalizeMessageText(`HCP: Hi ${recipientName}, your appointment with Dr. ${doctorName} is completed.`);

export const consultationCompletedWhatsApp = ({ recipientName, doctorName, durationMinutes }) =>
  normalizeMessageText(`HCP: Hi ${recipientName}, video consultation with Dr. ${doctorName}${durationMinutes ? ` (${durationMinutes} min)` : ''} is completed.`);

// Backward-compatible aliases for old SMS-named template helpers.
export const appointmentBookedSMS = appointmentBookedWhatsApp;
export const appointmentConfirmedSMS = appointmentConfirmedWhatsApp;
export const appointmentCancelledSMS = appointmentCancelledWhatsApp;
export const appointmentCompletedSMS = appointmentCompletedWhatsApp;
export const consultationCompletedSMS = consultationCompletedWhatsApp;
