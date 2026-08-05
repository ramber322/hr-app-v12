// Loader.jsx
import React from 'react';

const Loader = () => {
  const styles = `
    .loader {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .loader:before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      display: block;
      width: 5em;
      height: 0.5em;
      border-radius: 0.5em;
      transform: translate(-50%, -50%);
      animation: slide 2.5s infinite;
    }

    @keyframes slide {
      0% {
        width: 5em;
        box-shadow: 1em -0.5em #2b546b, -1em 0.5em #aabbc4;
      }
      35% {
        width: 0.5em;
        box-shadow: 0 -0.5em #2b546b, 0 0.5em #aabbc4;
      }
      70% {
        width: 0.5em;
        box-shadow: -1em -0.5em #2b546b, 1em 0.5em #aabbc4;
      }
      100% {
        width: 5em;
        box-shadow: 1em -0.5em #2b546b, -1em 0.5em #aabbc4;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="loader"></div>
    </>
  );
};

export default Loader;