// Lista de senhas comuns que devem ser bloqueadas
const COMMON_PASSWORDS = [
  'password', 'senha123', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'abc123', 'password1', 'password123', '111111', '123123',
  'admin123', 'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'sunshine', 'princess', 'football', 'iloveyou', 'trustno1', 'batman',
  'passw0rd', 'shadow', 'login', 'welcome1', 'qwerty123', 'admin',
  'mudar123', 'trocar123', 'senha', 'senha1234', 'minhasenha', 'teste123',
  '12341234', 'abcd1234', 'abcdef', 'abcdefgh', 'qwertyuiop', 'asdfghjkl',
];

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notCommon: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  const requirements = {
    minLength: password.length >= 9,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
  };

  if (!requirements.minLength) {
    errors.push('Mínimo de 9 caracteres');
  }
  if (!requirements.hasUppercase) {
    errors.push('Pelo menos uma letra maiúscula');
  }
  if (!requirements.hasLowercase) {
    errors.push('Pelo menos uma letra minúscula');
  }
  if (!requirements.hasNumber) {
    errors.push('Pelo menos um número');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Pelo menos um caractere especial (!@#$%^&*...)');
  }
  if (!requirements.notCommon) {
    errors.push('Esta senha é muito comum e insegura');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password) return 'weak';
  
  const { requirements } = validatePassword(password);
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  if (metRequirements <= 2) return 'weak';
  if (metRequirements <= 4) return 'medium';
  return 'strong';
}
