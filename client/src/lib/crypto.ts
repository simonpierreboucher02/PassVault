import CryptoJS from 'crypto-js';

export class PasswordCrypto {
  private static readonly ALGORITHM = 'AES';
  
  static encrypt(password: string, masterKey: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(password, masterKey).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Failed to encrypt password');
    }
  }
  
  static decrypt(encryptedPassword: string, masterKey: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedPassword, masterKey);
      const password = decrypted.toString(CryptoJS.enc.Utf8);
      if (!password) {
        throw new Error('Invalid decryption key');
      }
      return password;
    } catch (error) {
      throw new Error('Failed to decrypt password');
    }
  }
  
  static generateMasterKey(username: string, password: string): string {
    return CryptoJS.SHA256(username + password).toString();
  }
}

export function analyzePasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Moderate' | 'Strong';
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) {
    return { score, label: 'Weak', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score, label: 'Moderate', color: 'bg-yellow-500' };
  } else {
    return { score, label: 'Strong', color: 'bg-accent' };
  }
}
