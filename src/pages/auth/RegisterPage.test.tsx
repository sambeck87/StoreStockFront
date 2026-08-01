import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function passwordInputs() {
  const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
  return { password: inputs[0] as HTMLInputElement, confirm: inputs[1] as HTMLInputElement };
}

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('mantiene el botón deshabilitado hasta cumplir todos los requisitos', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ register: vi.fn() });

    renderPage();
    const button = screen.getByRole('button', { name: 'Registrarse' });
    expect(button).toBeDisabled();

    const { password } = passwordInputs();
    await user.type(password, 'abc');
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('habilita el botón cuando la contraseña cumple los requisitos y coincide', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ register: vi.fn() });

    renderPage();
    const { password, confirm } = passwordInputs();
    await user.type(password, 'Abcdef12');
    await user.type(confirm, 'Abcdef12');

    const button = screen.getByRole('button', { name: 'Registrarse' });
    expect(button).toBeEnabled();
  });

  it('registra al usuario con los datos ingresados y muestra el mensaje de éxito', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({ register });

    renderPage();
    await user.type(screen.getAllByRole('textbox')[0], 'Juan Pérez');
    await user.type(screen.getByPlaceholderText('user@example.com'), 'juan@x.com');
    const { password, confirm } = passwordInputs();
    await user.type(password, 'Abcdef12');
    await user.type(confirm, 'Abcdef12');

    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        full_name: 'Juan Pérez',
        email: 'juan@x.com',
        password: 'Abcdef12',
        password_confirmation: 'Abcdef12',
      })
    );
    expect(
      await screen.findByText(/Usuario registrado exitosamente/)
    ).toBeInTheDocument();
  });
});
