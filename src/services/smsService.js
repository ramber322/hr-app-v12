// Textbee SMS Service
const TEXTBEE_API_KEY = 'txb_yztKqRe8CHYVTMl6Bop8bFLItu5TZbLw0';
const TEXTBEE_DEVICE_ID = '6a9a699cccb6c727096c3a3b0';
const TEXTBEE_API_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms';

/**
 * Validate Philippine phone number
 * Must start with 09 and be exactly 11 digits
 */
export const isValidPhilippineNumber = (phone) => {
  if (!phone) return false;
  
  // Remove spaces, dashes, parentheses
  const cleaned = phone.toString().replace(/[\s\-()]/g, '');
  
  // Must be exactly 11 digits and start with 09
  return /^09\d{9}$/.test(cleaned);
};

/**
 * Format phone number to 09XXXXXXXXX
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.toString().replace(/[\s\-()]/g, '');
  
  // If starts with +63, convert to 09
  if (cleaned.startsWith('+63')) {
    return '0' + cleaned.slice(3);
  }
  // If starts with 63, convert to 09
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return '0' + cleaned.slice(2);
  }
  // If starts with 9 (10 digits), add 0
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    return '0' + cleaned;
  }
  
  return cleaned;
};

/**
 * Send a single SMS via Textbee
 */
export const sendSMS = async (recipient, message) => {
  const formattedNumber = formatPhoneNumber(recipient);
  
  if (!isValidPhilippineNumber(formattedNumber)) {
    return {
      success: false,
      error: `Invalid phone number: ${recipient}. Must start with 09 and be 11 digits.`
    };
  }
  
  try {
    const res = await fetch(TEXTBEE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': TEXTBEE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: TEXTBEE_DEVICE_ID,
        recipients: [formattedNumber],
        message,
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send SMS',
        data
      };
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Send bulk SMS to multiple recipients
 */
export const sendBulkSMS = async (recipients, message) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phone, message);
    results.push({
      name: recipient.name,
      phone: recipient.phone,
      success: result.success,
      error: result.error,
    });
  }
  
  return results;
};

/**
 * Generate SMS template for interview reminder
 */
export const generateInterviewSMSTemplate = (date, time, jobTitle) => {
  return `You have a scheduled appointment interview on ${date} at ${time} for ${jobTitle}. For more info, please read your email inbox. - CHRMO`;
};