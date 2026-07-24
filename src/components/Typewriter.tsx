import { useState, useEffect, ReactNode } from 'react';

export default function Typewriter({ 
  text, 
  speed = 10, 
  onComplete,
  renderText
}: { 
  text: string; 
  speed?: number; 
  onComplete?: () => void;
  renderText?: (text: string) => ReactNode;
}) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return <>{renderText ? renderText(displayedText) : <span>{displayedText}</span>}</>;
}
