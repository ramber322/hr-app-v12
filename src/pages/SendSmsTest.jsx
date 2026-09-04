import { useState } from 'react';

function SendSmsTest() {
  const [deviceId, setDeviceId] = useState('6a9a699cccb6c727096c3a3b');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('You have an scheduled appointment on Sep 24');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSendSms = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const apiKey = "txb_yztKqRe8CHYVTMl6Bop8bFLItu5TZbLw"

    try {
      const res = await fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          recipients: [recipient],
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send SMS');
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Textbee SMS Test</h2>

      <form onSubmit={handleSendSms} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Device ID</label>
          <input
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Recipient Number</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="09123456789"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={styles.textarea}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Sending...' : 'Send SMS'}
        </button>
      </form>

      {error && (
        <div style={styles.errorCard}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={styles.responseCard}>
          <strong>API Response:</strong>
          <pre style={styles.pre}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '480px',
    margin: '40px auto',
    padding: '24px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontFamily: 'sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333333',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  textarea: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    resize: 'vertical',
  },
  button: {
    padding: '12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#0066cc',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorCard: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '4px',
    backgroundColor: '#ffe6e6',
    color: '#cc0000',
    fontSize: '14px',
  },
  responseCard: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '4px',
    backgroundColor: '#f4f4f5',
    color: '#111827',
    fontSize: '14px',
  },
  pre: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    overflowX: 'auto',
  },
};

export default SendSmsTest;