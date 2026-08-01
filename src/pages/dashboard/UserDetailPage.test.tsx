import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserDetailPage } from './UserDetailPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  getBranches: vi.fn(),
  getRoles: vi.fn(),
  getGlobalPermissions: vi.fn(),
  manageUser: vi.fn(),
  revokeUserBranchAccess: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

const user = {
  id: 3,
  email: 'ana@x.com',
  full_name: 'Ana Pérez',
  branches: [{ id: 1, name: 'Sucursal A', role: { id: 2, name: 'admin' } }],
  global_permission: { id: 1, name: 'Supervisor' },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/users/3']}>
      <Routes>
        <Route path="/users/:id" element={<UserDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    apiMock.getUser.mockReset();
    apiMock.getBranches.mockReset();
    apiMock.getRoles.mockReset();
    apiMock.getGlobalPermissions.mockReset();
    apiMock.manageUser.mockReset();
    apiMock.revokeUserBranchAccess.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    toastMock.success.mockReset();
    vi.restoreAllMocks();
  });

  it('carga el usuario, sucursales, roles y permisos', async () => {
    apiMock.getUser.mockResolvedValue(user);
    apiMock.getBranches.mockResolvedValue([{ id: 1, name: 'Sucursal A' }, { id: 2, name: 'Sucursal B' }]);
    apiMock.getRoles.mockResolvedValue([{ id: 1, name: 'admin' }, { id: 2, name: 'vendedor' }]);
    apiMock.getGlobalPermissions.mockResolvedValue([{ id: 1, name: 'Supervisor' }]);

    renderPage();

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('ana@x.com')).toBeInTheDocument();
    expect(screen.getAllByText('Sucursal A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('admin').length).toBeGreaterThan(0);
    expect(apiMock.getUser).toHaveBeenCalledWith(3);
    expect(apiMock.getBranches).toHaveBeenCalled();
    expect(apiMock.getRoles).toHaveBeenCalled();
    expect(apiMock.getGlobalPermissions).toHaveBeenCalled();
  });

  it('muestra estado de usuario no encontrado', async () => {
    apiMock.getUser.mockRejectedValue(new Error('x'));
    apiMock.getBranches.mockResolvedValue([]);
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Usuario no encontrado')).toBeInTheDocument();
  });

  it('actualiza el permiso global', async () => {
    const u = userEvent.setup();
    apiMock.getUser.mockResolvedValue(user);
    apiMock.getBranches.mockResolvedValue([]);
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([{ id: 1, name: 'Supervisor' }, { id: 2, name: 'Admin Total' }]);
    apiMock.manageUser.mockResolvedValue(user);

    renderPage();
    await screen.findByText('Ana Pérez');

    const select = screen.getAllByRole('combobox')[0];
    await u.selectOptions(select, '2');
    await u.click(screen.getByRole('button', { name: 'Guardar Permisos' }));

    await waitFor(() => expect(apiMock.manageUser).toHaveBeenCalledWith(3, { global_permission_id: 2 }));
    expect(toastMock.success).toHaveBeenCalledWith('Permisos globales actualizados');
  });

  it('asocia una sucursal con un rol', async () => {
    const u = userEvent.setup();
    apiMock.getUser.mockResolvedValue({ ...user, branches: [] });
    apiMock.getBranches.mockResolvedValue([{ id: 1, name: 'Sucursal A' }]);
    apiMock.getRoles.mockResolvedValue([{ id: 2, name: 'admin' }]);
    apiMock.getGlobalPermissions.mockResolvedValue([]);
    apiMock.manageUser.mockResolvedValue({ ...user, branches: [{ id: 1, name: 'Sucursal A', role: { id: 2 } }] });

    renderPage();
    await screen.findByText('Ana Pérez');

    await u.click(screen.getByRole('button', { name: 'Asociar Sucursal' }));
    const selects = screen.getAllByRole('combobox');
    await u.selectOptions(selects[1], '1');
    await u.selectOptions(selects[2], '2');
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.manageUser).toHaveBeenCalledWith(3, { branch_id: 1, role_id: 2 })
    );
  });

  it('remueve el acceso a una sucursal tras confirmar', async () => {
    const u = userEvent.setup();
    apiMock.getUser.mockResolvedValue(user);
    apiMock.getBranches.mockResolvedValue([{ id: 1, name: 'Sucursal A' }]);
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([]);
    apiMock.revokeUserBranchAccess.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findAllByText('Sucursal A');

    const deleteButton = container.querySelector('button.text-red-500');
    await u.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.revokeUserBranchAccess).toHaveBeenCalledWith(3, 1));
  });
});
