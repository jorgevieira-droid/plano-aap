// Shared input validation utilities for edge functions

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^[\d\s\-\+\(\)]{8,20}$/;

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 255 && EMAIL_REGEX.test(email);
}

export function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function isValidPhone(phone: string): boolean {
  return typeof phone === 'string' && phone.length <= 20 && PHONE_REGEX.test(phone);
}

export function sanitizeString(str: string, maxLength = 255): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string') return { valid: false, error: 'Senha inválida' };
  if (password.length < 9) return { valid: false, error: 'A senha deve ter pelo menos 9 caracteres' };
  if (password.length > 128) return { valid: false, error: 'A senha deve ter no máximo 128 caracteres' };
  return { valid: true };
}

export function validateUUIDArray(ids: unknown): string[] | null {
  if (!Array.isArray(ids)) return null;
  const validated: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !isValidUUID(id)) return null;
    validated.push(id);
  }
  return validated;
}

const VALID_PROGRAMAS = ['escolas', 'regionais', 'redes_municipais'];

export function validateProgramas(programas: unknown): string[] | null {
  if (!Array.isArray(programas)) return null;
  for (const p of programas) {
    if (typeof p !== 'string' || !VALID_PROGRAMAS.includes(p)) return null;
  }
  return programas as string[];
}
