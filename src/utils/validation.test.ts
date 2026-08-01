import { describe, expect, it } from 'vitest';
import { validateForm, type ValidationRule } from './validation';

const rules: ValidationRule[] = [
  {
    field: 'name',
    rules: {
      required: 'El nombre es requerido',
      minLength: { value: 2, message: 'Muy corto' },
      maxLength: { value: 5, message: 'Muy largo' },
    },
  },
  {
    field: 'email',
    rules: {
      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
    },
  },
  {
    field: 'secret',
    rules: {
      custom: (value) => (value === 'open' ? null : 'No es open'),
    },
  },
];

describe('validateForm', () => {
  it('no reporta errores cuando todos los valores son válidos', () => {
    const errors = validateForm({ name: 'abc', email: 'a@b.co', secret: 'open' }, rules);
    expect(errors).toEqual({});
  });

  it('reporta campo requerido cuando el valor está vacío', () => {
    const errors = validateForm({ name: '', email: 'a@b.co' }, rules);
    expect(errors.name).toBe('El nombre es requerido');
  });

  it('reporta requerido para undefined y null', () => {
    expect(validateForm({}, rules).name).toBe('El nombre es requerido');
    expect(validateForm({ name: null }, rules).name).toBe('El nombre es requerido');
  });

  it('valida minLength', () => {
    expect(validateForm({ name: 'a', email: 'a@b.co' }, rules).name).toBe('Muy corto');
  });

  it('valida maxLength', () => {
    expect(validateForm({ name: 'abcdef', email: 'a@b.co' }, rules).name).toBe('Muy largo');
  });

  it('valida pattern de email', () => {
    expect(validateForm({ name: 'abc', email: 'no-es-email' }, rules).email).toBe('Email inválido');
  });

  it('valida reglas custom', () => {
    expect(validateForm({ name: 'abc', email: 'a@b.co', secret: 'cerrada' }, rules).secret).toBe('No es open');
  });

  it('respeta el required sin continuar validando ese campo vacío', () => {
    const errors = validateForm({ name: '', email: 'a@b.co' }, rules);
    expect(errors.name).toBe('El nombre es requerido');
    expect(errors.email).toBeUndefined();
  });

  it('no valida pattern/len cuando el valor está vacío y no es requerido', () => {
    const optionalRules: ValidationRule[] = [
      {
        field: 'email',
        rules: { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } },
      },
    ];
    expect(validateForm({ email: '' }, optionalRules)).toEqual({});
  });
});
