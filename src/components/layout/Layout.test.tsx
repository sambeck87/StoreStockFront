import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Layout } from './Layout';
import i18n from '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({ getStore: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));

function renderLayout() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<div>dashboard-content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const allPermissions = {
  store: ['index'],
  branch: ['index'],
  user: ['index'],
  category: ['index'],
  item: ['index'],
  permission: ['index'],
  role: ['index'],
  global_permission: ['index'],
};

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthMock.mockReset();
    apiMock.getStore.mockReset();
    vi.restoreAllMocks();
  });

  it('muestra la navegación y el contenido según los permisos', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, full_name: 'Ana', email: 'ana@x.com', store_id: 5 },
      logout: vi.fn(),
      permissionResources: allPermissions,
    });
    apiMock.getStore.mockResolvedValue({ id: 5, name: 'Mi Tienda' });

    renderLayout();

    expect(await screen.findByText('Mi Tienda')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('dashboard-content')).toBeInTheDocument();
  });

  it('oculta los enlaces de navegación cuando no hay permisos', () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, full_name: 'Ana', email: 'ana@x.com' },
      logout: vi.fn(),
      permissionResources: {},
    });
    apiMock.getStore.mockRejectedValue(new Error('x'));

    renderLayout();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
  });

  it('alterna el idioma y lo persiste en localStorage', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, full_name: 'Ana', email: 'ana@x.com' },
      logout: vi.fn(),
      permissionResources: allPermissions,
    });

    renderLayout();
    expect(screen.getByText('Panel')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Cambiar idioma'));

    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(localStorage.getItem('language')).toBe('en');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    await i18n.changeLanguage('es');
    localStorage.setItem('language', 'es');
  });

  it('alterna el tema claro/oscuro', () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, full_name: 'Ana', email: 'ana@x.com' },
      logout: vi.fn(),
      permissionResources: allPermissions,
    });

    renderLayout();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByTitle('Cambiar tema'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('cierra la sesión al hacer clic en logout', () => {
    const logout = vi.fn();
    useAuthMock.mockReturnValue({
      user: { id: 1, full_name: 'Ana', email: 'ana@x.com' },
      logout,
      permissionResources: allPermissions,
    });

    renderLayout();
    fireEvent.click(screen.getByTitle('Cerrar Sesión'));
    expect(logout).toHaveBeenCalled();
  });
});
