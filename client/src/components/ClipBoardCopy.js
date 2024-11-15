import React from 'react';
import clipboardCopy from 'clipboard-copy';

const ClipBoardCopy = ({ text }) => {
  const handleCopyClick = () => {
    clipboardCopy(text);
  };

  return (
    <div>
      <button onClick={handleCopyClick}>Copy to Clipboard</button>
    </div>
  );
};

export default ClipBoardCopy;
