// src/lib/auth-utils.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email is required.' };
  }
  
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  
  // Optional: Add more password strength requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return { isValid: true };
};

export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, message: 'Name is required.' };
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long.' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, message: 'Name cannot exceed 50 characters.' };
  }
  
  return { isValid: true };
};

export const validateRegistrationData = (email: string, password: string, name: string) => {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;
  
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) return nameValidation;
  
  return { isValid: true };
};
