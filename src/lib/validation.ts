// Input validation and sanitization utilities
export const sanitizeForLog = (input: string): string => {
  return input.replace(/[\r\n\t]/g, '_').substring(0, 100);
};

export const validatePin = (pin: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(pin);
};

export const validatePlayerId = (playerId: string): boolean => {
  return /^[a-f0-9]{24}$/.test(playerId);
};

export const validateAnswer = (answer: string): boolean => {
  return typeof answer === 'string' && answer.length <= 500;
};