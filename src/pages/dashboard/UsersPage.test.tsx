import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getBranchUsers: vi.fn(),
  deleteUser: vi.fn(),
  manageUser: vi.fn(),
  detachUserStore: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route path="/users" element={<UsersPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getUsers.mockReset();
    apiMock.getBranchUsers.mockReset();
    apiMock.deleteUser.mockReset();
    apiMock.manageUser.mockReset();
    apiMock.detachUserStore.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista todos los usuarios con permiso global', async () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, permissionResources: { user: ['index'] } });
    apiMock.getUsers.mockResolvedValue([
      { id: 1, email: 'ana@x.com', full_name: 'Ana', active: true },
      { id: 2, email: 'luis@x.com', full_name: 'Luis', active: false },
    ]);

    renderPage();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
    expect(apiMock.getUsers).toHaveBeenCalled();
  });

  it('lista usuarios de la sucursal asignada sin permiso global', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, branches: [{ id: 7, name: 'Sucursal A', role: { id: 2, name: 'admin' } }] },
      permissionResources: {},
    });
    apiMock.getBranchUsers.mockResolvedValue([{ id: 1, email: 'ana@x.com', full_name: 'Ana', active: true }]);

    renderPage();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(apiMock.getBranchUsers).toHaveBeenCalledWith(7);
  });

  it('muestra estado vacío sin ningún permiso', async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, branches: [] }, permissionResources: {} });

    renderPage();
    expect(await screen.findByText('No hay usuarios')).toBeInTheDocument();
    expect(apiMock.getUsers).not.toHaveBeenCalled();
    expect(apiMock.getBranchUsers).not.toHaveBeenCalled();
  });

  it('alterna el estado activo del usuario', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1 }, permissionResources: { user: ['index'] } });
    apiMock.getUsers.mockResolvedValue([{ id: 3, email: 'ana@x.com', full_name: 'Ana', active: true }]);
    apiMock.manageUser.mockResolvedValue({ id: 3, active: false });

    renderPage();
    await user.click(await screen.findByText('Activo'));

    await waitFor(() => expect(apiMock.manageUser).toHaveBeenCalledWith(3, { active: false }));
  });

  it('elimina un usuario tras confirmar', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1 }, permissionResources: { user: ['index'] } });
    apiMock.getUsers.mockResolvedValue([{ id: 3, email: 'ana@x.com', full_name: 'Ana', active: true }]);
    apiMock.deleteUser.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Ana');

    await user.click(screen.getAllByRole('button')[2]);

    await waitFor(() => expect(apiMock.deleteUser).toHaveBeenCalledWith(3));
  });

  it('desacopla al usuario de la tienda tras confirmar', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1 }, permissionResources: { user: ['index'] } });
    apiMock.getUsers.mockResolvedValue([{ id: 3, email: 'ana@x.com', full_name: 'Ana', active: true }]);
    apiMock.detachUserStore.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText('Ana');

    await user.click(screen.getAllByRole('button')[1]);

    await waitFor(() => expect(apiMock.detachUserStore).toHaveBeenCalledWith(3));
  });
});
