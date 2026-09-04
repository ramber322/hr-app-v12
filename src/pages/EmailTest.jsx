// src/pages/EmailTest.jsx
import { useState } from 'react';
import Navbar from '../components/Navbar';
import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const SERVICE_ID = 'HR-APP-EMAILJS';
const TEMPLATE_ID = 'template_qqitxyc';
const PUBLIC_KEY = 'BcfR8UpBMwRS06YQg';

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [candidateName, setCandidateName] = useState('Juan Dela Cruz');
  const [jobTitle, setJobTitle] = useState('Administrative Assistant I');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('CHRMO Office, Room 301');
  const [notes, setNotes] = useState('Please bring your valid ID.');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

 const handleSendEmail = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage(null);
  setError(null);

  try {
    const templateParams = {
      email: email || 'test@example.com',
      name: candidateName || 'Applicant',
      title: jobTitle || 'Position',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '09:00 AM',
      location: location || 'CHRMO Office, Room 301',
      notes: notes || 'No additional notes.',
    };

    console.log('📧 Sending email to:', email);
    console.log('📝 Template params:', templateParams);

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);

    if (result.status === 200) {
      setMessage('✅ Email sent successfully! Check your inbox.');
    } else {
      setError(`Failed with status: ${result.status}`);
    }
  } catch (err) {
    console.error('Error:', err);
    setError(err.text || 'Failed to send email. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const styles = {
    container: {
      paddingTop: '80px',
      paddingLeft: '24px',
      paddingRight: '24px',
      paddingBottom: '40px',
      maxWidth: '600px',
      margin: '0 auto',
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      color: '#1a1f36',
      margin: '0 0 4px 0',
    },
    subtitle: {
      color: '#6c757d',
      margin: '0',
      fontSize: '14px',
    },
    formGroup: {
      marginBottom: '14px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#4a5568',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #dee2e6',
      borderRadius: '6px',
      fontSize: '14px',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    },
    btn: {
      padding: '10px 20px',
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      width: '100%',
      marginTop: '8px',
    },
    btnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    success: {
      padding: '12px',
      background: '#e8f5e9',
      color: '#2e7d32',
      borderRadius: '6px',
      marginTop: '12px',
    },
    error: {
      padding: '12px',
      background: '#ffebee',
      color: '#c62828',
      borderRadius: '6px',
      marginTop: '12px',
    },
  };

  return (
    <>
      <Navbar userRole="hr" />
      
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>📧 Email Test</h1>
            <p style={styles.subtitle}>Test interview scheduling emails</p>
          </div>

          <form onSubmit={handleSendEmail}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Recipient Email *</label>
              <input
                type="email"
                placeholder="applicant@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Candidate Name</label>
              <input
                type="text"
                placeholder="Juan Dela Cruz"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Job Title</label>
              <input
                type="text"
                placeholder="Administrative Assistant I"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                placeholder="CHRMO Office, Room 301"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                rows="2"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                ...(loading ? styles.btnDisabled : {}),
              }}
            >
              {loading ? 'Sending...' : '📤 Send Email'}
            </button>
          </form>

          {message && (
            <div style={styles.success}>{message}</div>
          )}

          {error && (
            <div style={styles.error}>❌ {error}</div>
          )}
        </div>
      </div>
    </>
  );
}