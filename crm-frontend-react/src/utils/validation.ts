export interface ValidationResult {
  valid: boolean;
  message: string;
}

export const validate = {
  required(value: string): ValidationResult {
    const valid = !!value && value.trim().length > 0;
    return { valid, message: valid ? '' : 'Это поле обязательно для заполнения' };
  },

  email(email: string): ValidationResult {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return { valid, message: valid ? '' : 'Введите корректный email адрес' };
  },

  phone(phone: string): ValidationResult {
    const valid = /^\+?7?\s?\(?\d{3}\)?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/.test(phone);
    return { valid, message: valid ? '' : 'Введите корректный номер телефона (например: +7 (999) 123-45-67)' };
  },

  minLength(value: string, min: number): ValidationResult {
    const valid = value.length >= min;
    return { valid, message: valid ? '' : `Минимальная длина: ${min} символов` };
  },

  maxLength(value: string, max: number): ValidationResult {
    const valid = value.length <= max;
    return { valid, message: valid ? '' : `Максимальная длина: ${max} символов` };
  },

  number(value: string | number): ValidationResult {
    const valid = !isNaN(Number(value)) && isFinite(Number(value));
    return { valid, message: valid ? '' : 'Введите корректное число' };
  },

  positiveNumber(value: string | number): ValidationResult {
    const num = parseFloat(String(value));
    const valid = !isNaN(num) && isFinite(num) && num > 0;
    return { valid, message: valid ? '' : 'Введите положительное число' };
  },

  integer(value: string | number): ValidationResult {
    const valid = Number.isInteger(Number(value));
    return { valid, message: valid ? '' : 'Введите целое число' };
  },

  date(date: string): ValidationResult {
    const d = new Date(date);
    const valid = d instanceof Date && !isNaN(d.getTime());
    return { valid, message: valid ? '' : 'Введите корректную дату' };
  },

  futureDate(date: string): ValidationResult {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const valid = d >= today;
    return { valid, message: valid ? '' : 'Дата не может быть в прошлом' };
  },

  time(time: string): ValidationResult {
    const valid = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    return { valid, message: valid ? '' : 'Введите корректное время (например: 14:30)' };
  },

  price(price: string | number): ValidationResult {
    const num = parseFloat(String(price));
    const valid = !isNaN(num) && isFinite(num) && num >= 0;
    return { valid, message: valid ? '' : 'Введите корректную цену' };
  },
};

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned[0] === '7') {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }
  if (cleaned.length === 10) {
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return phone;
}
