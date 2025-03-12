import React from 'react';
import { Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const CopyToClipboardButton = ({ text }) => {
  const handleCopy = () => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Copied to clipboard!');
  };

  return (
    <Button type="primary" s onClick={handleCopy} icon={<CopyOutlined size={10} />}>
      
    </Button>
  );
};

export default CopyToClipboardButton;
