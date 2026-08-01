import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const apiMock = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  getUser: vi.fn(),
  getRole: vi.fn(),
  getGlobalPermission: vi.fn(),
}));

vi.mock('../api', () => ({ api: apiMock }));

function Harness() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user?.email ?? 'none'}</span>
      <span data-testid="token">{auth.token ?? 'none'}</span>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="perms">{JSON.stringify(auth.permissionResources)}</span>
      <span data-testid="has-create">{String(auth.hasPermission('items', 'create'))}</span>
      <span data-testid="has-delete">{String(auth.hasPermission('items', 'delete'))}</span>
      <span data-testid="can-store">{String(auth.canAccessStore())}</span>
      <button onClick={() => auth.login({ email: 'a@b.c', password: 'pw' })}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => auth.register({ email: 'a@b.c', password: 'pw', password_confirmation: 'pw', full_name: 'A' })}>
        register
      </button>
      <button onClick={() => auth.refreshPermissions()}>refresh</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('lanza error si useAuth se usa fuera del provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  it('restaura la sesión desde localStorage', async () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify({ id: 5, email: 'b@c.d' }));
    apiMock.getUser.mockResolvedValue({ id: 5, email: 'b@c.d', full_name: 'B', store_id: 3 });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('saved-token'));
    expect(screen.getByTestId('user')).toHaveTextContent('b@c.d');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('can-store')).toHaveTextContent('true');
  });

  it('limpia la sesión si el usuario guardado ya no es válido', async () => {
    localStorage.setItem('token', 'stale');
    localStorage.setItem('user', JSON.stringify({ id: 9, email: 'a@b.c' }));
    apiMock.getUser.mockRejectedValue(new Error('gone'));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('none'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('inicia sesión, persiste token/usuario y fusiona permisos de roles y globales', async () => {
    apiMock.login.mockResolvedValue({ token: 'new-token', user: { id: 1, email: 'a@b.c' }, expires_in: 3600 });
    apiMock.getUser.mockResolvedValue({
      id: 1,
      email: 'a@b.c',
      full_name: 'A',
      global_permission: { id: 9 },
      branches: [{ id: 1, name: 'b', role: { id: 2 } }],
    });
    apiMock.getGlobalPermission.mockResolvedValue({ id: 9, name: 'gp', permissions: { store: ['all'] } });
    apiMock.getRole.mockResolvedValue({ id: 2, name: 'r', permissions: { items: ['create'] } });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('new-token'));
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.c');
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('user')).toContain('a@b.c');
    expect(screen.getByTestId('perms')).toHaveTextContent('"store":["all"]');
    expect(screen.getByTestId('perms')).toHaveTextContent('"items":["create"]');
    expect(screen.getByTestId('has-create')).toHaveTextContent('true');
    expect(screen.getByTestId('has-delete')).toHaveTextContent('false');
    expect(screen.getByTestId('can-store')).toHaveTextContent('true');
  });

  it('permite cualquier acción con permiso all/*', async () => {
    apiMock.login.mockResolvedValue({ token: 't', user: { id: 1, email: 'a@b.c' }, expires_in: 3600 });
    apiMock.getUser.mockResolvedValue({ id: 1, email: 'a@b.c', branches: [{ id: 1, role: { id: 2 } }] });
    apiMock.getRole.mockResolvedValue({ id: 2, name: 'r', permissions: { items: ['all'] } });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('has-create')).toHaveTextContent('true'));
    expect(screen.getByTestId('has-delete')).toHaveTextContent('true');
  });

  it('usa un usuario básico cuando getUser falla tras el login', async () => {
    apiMock.login.mockResolvedValue({ token: 't2', user: { id: 7, email: 'x@y.z' }, expires_in: 3600 });
    apiMock.getUser.mockRejectedValue(new Error('nope'));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('t2'));
    expect(screen.getByTestId('user')).toHaveTextContent('x@y.z');
    expect(screen.getByTestId('perms')).toHaveTextContent('{}');
  });

  it('registro guarda el token', async () => {
    apiMock.register.mockResolvedValue({ token: 'reg-token', user: { id: 3, email: 'r@t.c' }, expires_in: 3600 });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('register'));

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('reg-token'));
    expect(localStorage.getItem('token')).toBe('reg-token');
  });

  it('logout limpia token, usuario y selección de tienda', async () => {
    apiMock.login.mockResolvedValue({ token: 't', user: { id: 1, email: 'a@b.c' }, expires_in: 3600 });
    apiMock.getUser.mockResolvedValue({ id: 1, email: 'a@b.c' });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('t'));
    localStorage.setItem('selectedStoreId', '3');

    fireEvent.click(screen.getByText('logout'));

    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('selectedStoreId')).toBeNull();
  });

  it('cierra la sesión cuando se dispara auth:expired', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'a@b.c' }));
    apiMock.getUser.mockResolvedValue({ id: 1, email: 'a@b.c' });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('tok'));

    fireEvent(window, new Event('auth:expired'));

    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('refreshPermissions actualiza usuario y permisos', async () => {
    apiMock.login.mockResolvedValue({ token: 't', user: { id: 1, email: 'a@b.c' }, expires_in: 3600 });
    apiMock.getUser.mockResolvedValueOnce({ id: 1, email: 'a@b.c' });
    apiMock.getUser.mockResolvedValueOnce({
      id: 1,
      email: 'a@b.c',
      full_name: 'Renovado',
      branches: [{ id: 1, role: { id: 2 } }],
    });
    apiMock.getRole.mockResolvedValue({ id: 2, name: 'r', permissions: { items: ['create'] } });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('t'));

    fireEvent.click(screen.getByText('refresh'));

    await waitFor(() => expect(screen.getByTestId('perms')).toHaveTextContent('"items":["create"]'));
  });
});
