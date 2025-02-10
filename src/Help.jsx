/**
 * @fileoverview Proof of concept for React library catalog application.
 * @author Bob Kline
 * @date 2024-11-08
 */
import React, { useEffect, useState } from 'react';

const Help = (props) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/library/static/help.html');
        if (!response.ok) {
          throw new Error('File not found.');
        }
        const data = await response.text();
        setContent(data);
      } catch (error) {
        console.error('Unable to fetch help HTML', error);
      }
    };
    fetchData();
  }, []);

  const getClassName = () => {
    if (props.user.admin)
      return 'admin';
    if (props.user.readonly)
      return 'readonly';
    return 'editor';
  };

  return (
    <div>
      <h1>User Manual</h1>
      <div
        className={getClassName()}
        dangerouslySetInnerHTML={{__html: content }}
      />
    </div>
  );
};

export default Help;
