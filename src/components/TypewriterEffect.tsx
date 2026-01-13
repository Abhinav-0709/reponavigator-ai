import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TypewriterEffectProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
}

export function TypewriterEffect({ content, speed = 5, onComplete }: TypewriterEffectProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  if (!content) return null;

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      if (index < content.length) {
        // Reveal a chunk of characters at once for better performance with large blocks
        const chunkSize = 3; 
        const nextChunk = content.slice(index, index + chunkSize);
        
        setDisplayedContent((prev) => prev + nextChunk);
        index += chunkSize;
      } else {
        clearInterval(intervalId);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [content, speed, onComplete]);

  // If already complete (e.g. re-render), show full content immediately to avoid re-typing
  if (isComplete) {
     return <MarkdownRenderer content={content} />;
  }

  return <MarkdownRenderer content={displayedContent} />;
}
