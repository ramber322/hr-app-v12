import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const SERVICE_ID = 'HR-APP-EMAILJS0';
const TEMPLATE_ID = 'template_qqitxyc0';
const TEMPLATE_ID_RESCHEDULE = 'template_x2xng2r0'; // NEW: Reschedule template
const PUBLIC_KEY = 'BcfR8UpBMwRS06YQg0';

emailjs.init(PUBLIC_KEY);

export const sendInterviewEmail = async ({ to, name, title, date, time, location, notes }) => {
  try {
    const templateParams = {
      email: to,
      name: name,
      title: title,
      date: date,
      time: time,
      location: location,
      notes: notes || 'No additional notes.',
    };

    console.log(' Sending email to:', to);
    console.log(' Template params:', templateParams);

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);

    if (result.status === 200) {
      return { success: true, message: 'Email sent successfully!' };
    } else {
      return { success: false, error: `Status: ${result.status}` };
    }
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.text || 'Failed to send email' };
  }
};

// Add this to your emailService.js
// NEW: Send reschedule email
export const sendRescheduleEmail = async ({ to, name, title, date, time, location, notes, reason }) => {
  try {
    const templateParams = {
      email: to,
      name: name,
      title: title,
      date: date,
      time: time,
      location: location,
      notes: notes || 'No additional notes.',
      reason: reason || 'Rescheduled by HR',
    };

    console.log('📧 Sending reschedule email to:', to);
    console.log('📝 Reschedule template params:', templateParams);

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID_RESCHEDULE, templateParams);

    if (result.status === 200) {
      return { success: true, message: 'Reschedule email sent!' };
    } else {
      return { success: false, error: `Status: ${result.status}` };
    }
  } catch (error) {
    console.error('Reschedule email error:', error);
    return { success: false, error: error.text || 'Failed to send reschedule email' };
  }
};