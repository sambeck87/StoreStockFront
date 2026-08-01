import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({ getErrorMessage: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/store-select" element={<div>store-select-page</div>} />
        <Route path="/inventory" element={<div>inventory-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getErrorMessage.mockReset();
  });

  it('renderiza el formulario de login', () => {
    useAuthMock.mockReturnValue({ login: vi.fn(), user: null });
    renderPage();
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
  });

  it('envía las credenciales y navega a /store-select sin tienda asignada', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => {
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'a@b.c', store_id: null }));
    });
    useAuthMock.mockReturnValue({ login, user: null });

    renderPage();
    await user.type(screen.getByPlaceholderText('user@example.com'), 'a@b.c');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secreto' }));
    expect(await screen.findByText('store-select-page')).toBeInTheDocument();
  });

  it('navega a /inventory cuando el usuario ya tiene tienda', async () => {
    useAuthMock.mockReturnValue({ login: vi.fn(), user: { id: 1, store_id: 3 } });
    renderPage();
    expect(await screen.findByText('inventory-page')).toBeInTheDocument();
  });

  it('muestra el mensaje de error cuando el login falla', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('fail'));
    apiMock.getErrorMessage.mockReturnValue('credenciales inválidas');
    useAuthMock.mockReturnValue({ login, user: null });

    renderPage();
    await user.type(screen.getByPlaceholderText('user@example.com'), 'a@b.c');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secreto');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    expect(await screen.findByText('credenciales inválidas')).toBeInTheDocument();
  });
});
