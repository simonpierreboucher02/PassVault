export interface PasswordGeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export class PasswordGenerator {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  static generate(options: PasswordGeneratorOptions): string {
    let charset = '';
    
    if (options.uppercase) charset += this.UPPERCASE;
    if (options.lowercase) charset += this.LOWERCASE;
    if (options.numbers) charset += this.NUMBERS;
    if (options.symbols) charset += this.SYMBOLS;
    
    if (!charset) {
      throw new Error('At least one character type must be selected');
    }
    
    let password = '';
    
    // Ensure at least one character from each selected type
    const guaranteedChars: string[] = [];
    if (options.uppercase) guaranteedChars.push(this.getRandomChar(this.UPPERCASE));
    if (options.lowercase) guaranteedChars.push(this.getRandomChar(this.LOWERCASE));
    if (options.numbers) guaranteedChars.push(this.getRandomChar(this.NUMBERS));
    if (options.symbols) guaranteedChars.push(this.getRandomChar(this.SYMBOLS));
    
    // Add guaranteed characters
    for (const char of guaranteedChars) {
      password += char;
    }
    
    // Fill remaining length with random characters
    for (let i = guaranteedChars.length; i < options.length; i++) {
      password += this.getRandomChar(charset);
    }
    
    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }
  
  private static getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
  }
  
  private static shuffleString(str: string): string {
    return str.split('').sort(() => Math.random() - 0.5).join('');
  }
}
