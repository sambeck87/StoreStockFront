export interface ValidationRule {
  field: string;
  rules: {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: (value: unknown) => string | null;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateForm(data: Record<string, unknown>, rules: ValidationRule[]): ValidationErrors {
  const errors: ValidationErrors = {};

  for (const rule of rules) {
    const value = data[rule.field];
    const fieldRules = rule.rules;

    if (fieldRules.required !== undefined) {
      if (value === undefined || value === null || value === '') {
        errors[rule.field] = fieldRules.required;
        continue;
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      if (fieldRules.minLength !== undefined) {
        if (String(value).length < fieldRules.minLength.value) {
          errors[rule.field] = fieldRules.minLength.message;
        }
      }

      if (fieldRules.maxLength !== undefined) {
        if (String(value).length > fieldRules.maxLength.value) {
          errors[rule.field] = fieldRules.maxLength.message;
        }
      }

      if (fieldRules.pattern !== undefined) {
        if (!fieldRules.pattern.value.test(String(value))) {
          errors[rule.field] = fieldRules.pattern.message;
        }
      }

      if (fieldRules.custom !== undefined) {
        const customError = fieldRules.custom(value);
        if (customError) {
          errors[rule.field] = customError;
        }
      }
    }
  }

  return errors;
}

export const validationMessages = {
  required: 'Este campo es requerido',
  nameRequired: 'El nombre es requerido',
  emailRequired: 'El correo electrónico es requerido',
  emailInvalid: 'Ingresa un correo electrónico válido',
  passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
  passwordFormat: 'La contraseña debe contener al menos una mayúscula y un número',
  nameMinLength: 'El nombre debe tener al menos 2 caracteres',
  nameMaxLength: 'El nombre no puede exceder 100 caracteres',
};
