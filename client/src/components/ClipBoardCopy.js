import React from 'react';
import clipboardCopy from 'clipboard-copy';
import './clip.css';

const ClipBoardCopy = ({ text }) => {
  const handleCopyClick = () => {
    clipboardCopy(text);
  };

  return (
    <div className='clip'>
      <button onClick={handleCopyClick}>Copy to Clipboard</button>
    </div>
  );
};

export default ClipBoardCopy;
