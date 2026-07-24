export const parseLanguage = (text: string) => {
  // Simple heuristic for demo purposes
  const words = text.split(' ');
  const subject = words[0] || 'Unknown';
  const object = words.slice(1).join(' ') || 'Unknown';
  return { subject, object };
};
