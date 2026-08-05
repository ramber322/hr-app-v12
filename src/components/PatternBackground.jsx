// src/components/PatternBackground.jsx
export const PatternBackground = ({ 
  color = '#4f46e5', 
  opacity = 0.12,
  bgColor = 'transparent'
}) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 0,
      backgroundColor: bgColor,
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 30% 40%, ${color}03 0%, transparent 60%),
                     radial-gradient(circle at 70% 60%, ${color}03 0%, transparent 60%)`,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 200 200"
      >
        {[...Array(6)].map((_, row) =>
          [...Array(6)].map((_, col) => {
            const x = col * 35 + 10;
            const y = row * 35 + 10;
            return (
              <g key={`${row}-${col}`} transform={`translate(${x}, ${y}) scale(0.5)`}>
                <path
                  fill="none"
                  stroke={color}
                  strokeOpacity={opacity}
                  strokeWidth="1.5"
                  d="M69.212 40H46.118L34.57 20 46.118 0h23.094l11.547 20zM57.665 60H34.57L23.023 40 34.57 20h23.095l11.547 20zm0-40H34.57L23.023 0 34.57-20h23.095L69.212 0zM34.57 60H11.476L-.07 40l11.547-20h23.095l11.547 20zm0-40H11.476L-.07 0l11.547-20h23.095L46.118 0zM23.023 40H-.07l-11.547-20L-.07 0h23.094L34.57 20z"
                />
              </g>
            );
          })
        )}
      </svg>
    </div>
  </div>
);