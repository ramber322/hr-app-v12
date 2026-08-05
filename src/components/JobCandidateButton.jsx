// src/components/ViewDocButton.jsx
export default function JobCandidateButton({ onClick, label = "View", width = "85px" }) {
  return (
    <button 
      className="view-doc-btn"
      onClick={onClick}
      style={{
        backgroundColor: 'transparent',
        color: '#3654ff',
        border: '2px solid #3654ff',
        borderRadius: '11px',
        padding: '6px 16px',
        transition: 'all 0.6s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: '500',
        width: width,
        height: '34px',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#3654ff';
        e.currentTarget.style.color = 'white';
        const svg = e.currentTarget.querySelector('svg');
        if (svg) svg.style.transform = 'translateX(5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#3654ff';
        const svg = e.currentTarget.querySelector('svg');
        if (svg) svg.style.transform = 'translateX(0px)';
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor" 
        style={{
          width: '16px',
          height: '16px',
          transition: 'all 0.6s ease',
          flexShrink: 0,
          marginLeft: '-10px',
        }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
      </svg>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}