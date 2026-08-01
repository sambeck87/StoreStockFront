import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { ConfirmEmailPage } from './ConfirmEmailPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  confirmEmail: vi.fn(),
  getErrorMessage: vi.fn(),
}));

vi.mock('../../api', () => ({ api: apiMock }));

function renderPath(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split('?')[0]} element={element} />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    apiMock.resetPassword.mockReset();
    apiMock.getErrorMessage.mockReset();
  });

  it('envía el correo y muestra el mensaje de confirmación', async () => {
    const user = userEvent.setup();
    apiMock.resetPassword.mockResolvedValue(undefined);

    renderPath('/', <ForgotPasswordPage />);
    await user.type(screen.getByPlaceholderText('user@example.com'), 'a@b.c');
    await user.click(screen.getByRole('button', { name: 'Enviar Instrucciones' }));

    await waitFor(() => expect(apiMock.resetPassword).toHaveBeenCalledWith('a@b.c'));
    expect(await screen.findByText(/Se ha enviado un correo/)).toBeInTheDocument();
  });

  it('muestra el error cuando la API falla', async () => {
    const user = userEvent.setup();
    apiMock.resetPassword.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('error de red');

    renderPath('/', <ForgotPasswordPage />);
    await user.type(screen.getByPlaceholderText('user@example.com'), 'a@b.c');
    await user.click(screen.getByRole('button', { name: 'Enviar Instrucciones' }));

    expect(await screen.findByText('error de red')).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    apiMock.updatePassword.mockReset();
    apiMock.getErrorMessage.mockReset();
  });

  it('muestra error si no hay token de recuperación', async () => {
    renderPath('/reset-password', <ResetPasswordPage />);
    expect(await screen.findByText('Token de recuperación inválido')).toBeInTheDocument();
  });

  it('actualiza la contraseña y muestra la confirmación', async () => {
    const user = userEvent.setup();
    apiMock.updatePassword.mockResolvedValue(undefined);

    renderPath('/reset-password?token=abc123', <ResetPasswordPage />);
    const [password, confirm] = Array.from(
      document.querySelectorAll('input[type="password"]')
    ) as HTMLInputElement[];
    await user.type(password, 'Abcdef12');
    await user.type(confirm, 'Abcdef12');
    await user.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));

    await waitFor(() =>
      expect(apiMock.updatePassword).toHaveBeenCalledWith('abc123', 'Abcdef12', 'Abcdef12')
    );
    expect(await screen.findByText('Contraseña Actualizada')).toBeInTheDocument();
  });

  it('muestra el error de la API', async () => {
    const user = userEvent.setup();
    apiMock.updatePassword.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('token expirado');

    renderPath('/reset-password?token=abc123', <ResetPasswordPage />);
    const [password, confirm] = Array.from(
      document.querySelectorAll('input[type="password"]')
    ) as HTMLInputElement[];
    await user.type(password, 'Abcdef12');
    await user.type(confirm, 'Abcdef12');
    await user.click(screen.getByRole('button', { name: 'Cambiar Contraseña' }));

    expect(await screen.findByText('token expirado')).toBeInTheDocument();
  });
});

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    apiMock.confirmEmail.mockReset();
  });

  it('confirma el correo y muestra el estado de éxito', async () => {
    apiMock.confirmEmail.mockResolvedValue(undefined);
    renderPath('/confirm-email?token=tok', <ConfirmEmailPage />);
    expect(await screen.findByText('Correo confirmado')).toBeInTheDocument();
  });

  it('muestra error cuando el token es inválido', async () => {
    apiMock.confirmEmail.mockRejectedValue(new Error('invalid'));
    renderPath('/confirm-email?token=tok', <ConfirmEmailPage />);
    expect(await screen.findByText('El token es inválido o ha expirado.')).toBeInTheDocument();
  });

  it('muestra error si falta el token', async () => {
    renderPath('/confirm-email', <ConfirmEmailPage />);
    expect(await screen.findByText('El token es inválido o ha expirado.')).toBeInTheDocument();
  });
});
