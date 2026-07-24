export function useSpeech(enabled: boolean) {
  const speak = (text: string) => {
    if (!enabled) return;
    
    // Clean text of markdown-like syntax for better synthesis
    const cleanText = text.replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set a neutral, clear voice if possible
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };
  
  return { speak };
}
