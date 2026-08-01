import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PermissionsPage } from './PermissionsPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getRoles: vi.fn(),
  getRole: vi.fn(),
  getGlobalPermissions: vi.fn(),
  getGlobalPermission: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  createGlobalPermission: vi.fn(),
  updateGlobalPermission: vi.fn(),
  deleteRole: vi.fn(),
  deleteGlobalPermission: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/permissions']}>
      <Routes>
        <Route path="/permissions" element={<PermissionsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PermissionsPage', () => {
  beforeEach(() => {
    Object.values(apiMock).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista los roles excluyendo super_admin', async () => {
    apiMock.getRoles.mockResolvedValue([
      { id: 1, name: 'admin', permissions: { user: ['index', 'create'] } },
      { id: 2, name: 'super_admin', permissions: {} },
    ]);

    renderPage();

    expect((await screen.findAllByText('admin')).length).toBeGreaterThan(0);
    expect(screen.queryByText('super_admin')).not.toBeInTheDocument();
    expect(screen.getAllByText('2 asignados').length).toBeGreaterThan(0);
  });

  it('cambia a la pestaña de permisos globales', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([{ id: 1, name: 'Supervisor', permissions: {} }]);

    renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Permisos Globales' }));

    expect((await screen.findAllByText('Supervisor')).length).toBeGreaterThan(0);
    expect(apiMock.getGlobalPermissions).toHaveBeenCalled();
  });

  it('valida que el nombre del rol sea obligatorio', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);

    renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Nuevo' }));
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(toastMock.error).toHaveBeenCalledWith('El nombre es requerido');
    expect(apiMock.createRole).not.toHaveBeenCalled();
  });

  it('crea un rol con permisos y las acciones de escritura agregan las de lectura', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.createRole.mockResolvedValue({ id: 9, name: 'cajero' });

    renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Nuevo' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await u.type(nameInput, 'cajero');

    const checkboxes = screen.getAllByRole('checkbox');
    await u.click(checkboxes[3]);

    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'cajero',
          permissions: expect.objectContaining({
            user: expect.arrayContaining(['create', 'index', 'show']),
            item: [],
          }),
        })
      )
    );
  });

  it('selecciona todos los permisos de un recurso', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.createRole.mockResolvedValue({ id: 9, name: 'admin' });

    renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Nuevo' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await u.type(nameInput, 'admin');

    const checkboxes = screen.getAllByRole('checkbox');
    await u.click(checkboxes[0]);

    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.objectContaining({
            user: ['index', 'show', 'create', 'update', 'delete', 'manage', 'revoke_access'],
          }),
        })
      )
    );
  });

  it('edita un rol cargando sus permisos actuales', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([{ id: 5, name: 'vendedor', permissions: { user: ['index'] } }]);
    apiMock.getRole.mockResolvedValue({
      id: 5,
      name: 'vendedor',
      permissions: { user: ['index', 'show'], item: [] },
    });
    apiMock.updateRole.mockResolvedValue({ id: 5, name: 'vendedor' });

    const { container } = renderPage();
    await screen.findAllByText('vendedor');

    const editButton = container.querySelector('tbody button');
    await u.click(editButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.getRole).toHaveBeenCalledWith(5));

    const nameInput = screen.getByDisplayValue('vendedor');
    await u.clear(nameInput);
    await u.type(nameInput, 'vendedor senior');
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.updateRole).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ name: 'vendedor senior' })
      )
    );
  });

  it('elimina un rol tras confirmar', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([{ id: 5, name: 'vendedor', permissions: {} }]);
    apiMock.deleteRole.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findAllByText('vendedor');

    const deleteButton = container.querySelector('button.text-red-500');
    await u.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.deleteRole).toHaveBeenCalledWith(5));
  });

  it('crea un permiso global desde la pestaña de permisos', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([]);
    apiMock.createGlobalPermission.mockResolvedValue({ id: 9, name: 'Auditor' });

    renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Permisos Globales' }));
    await screen.findByText('No hay permisos globales');

    await u.click(screen.getByRole('button', { name: 'Nuevo' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await u.type(nameInput, 'Auditor');
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.createGlobalPermission).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Auditor' })
      )
    );
  });

  it('elimina un permiso global tras confirmar', async () => {
    const u = userEvent.setup();
    apiMock.getRoles.mockResolvedValue([]);
    apiMock.getGlobalPermissions.mockResolvedValue([{ id: 7, name: 'Auditor', permissions: {} }]);
    apiMock.deleteGlobalPermission.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findByText('No hay roles');

    await u.click(screen.getByRole('button', { name: 'Permisos Globales' }));
    await screen.findAllByText('Auditor');

    const deleteButton = container.querySelector('button.text-red-500');
    await u.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.deleteGlobalPermission).toHaveBeenCalledWith(7));
  });
});
