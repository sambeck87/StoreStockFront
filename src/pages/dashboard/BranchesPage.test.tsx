import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BranchesPage } from './BranchesPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getBranches: vi.fn(),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deleteBranch: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/branches']}>
      <Routes>
        <Route path="/branches" element={<BranchesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BranchesPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getBranches.mockReset();
    apiMock.createBranch.mockReset();
    apiMock.updateBranch.mockReset();
    apiMock.deleteBranch.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista las sucursales obtenidas de la API', async () => {
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([
      { id: 1, name: 'Sucursal Centro', phone: '555-0100' },
      { id: 2, name: 'Sucursal Norte', phone: '555-0200' },
    ]);

    renderPage();
    expect(await screen.findByText('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();
  });

  it('valida que el nombre sea obligatorio al crear', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([]);

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Sucursal' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(apiMock.createBranch).not.toHaveBeenCalled();
  });

  it('crea una sucursal nueva', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 7 } });
    apiMock.getBranches.mockResolvedValue([]);
    apiMock.createBranch.mockResolvedValue({ id: 3, name: 'Nueva' });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Sucursal' }));
    const [nameInput, phoneInput] = screen.getAllByRole('textbox') as HTMLInputElement[];
    await user.type(nameInput, 'Sucursal Nuevo');
    await user.type(phoneInput, '555-9999');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.createBranch).toHaveBeenCalledWith({
        name: 'Sucursal Nuevo',
        phone: '555-9999',
        store_id: 7,
      })
    );
    expect(apiMock.getBranches).toHaveBeenCalled();
  });

  it('edita una sucursal existente', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([{ id: 5, name: 'Antigua', phone: '555-1111' }]);
    apiMock.updateBranch.mockResolvedValue({ id: 5, name: 'Renombrada' });

    const { container } = renderPage();
    await screen.findByText('Antigua');

    const editButton = container.querySelector('tbody button');
    expect(editButton).not.toBeNull();
    await user.click(editButton as HTMLButtonElement);

    const nameInput = screen.getByDisplayValue('Antigua');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renombrada');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.updateBranch).toHaveBeenCalledWith(5, { name: 'Renombrada', phone: '555-1111' })
    );
  });

  it('elimina una sucursal tras confirmar', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([{ id: 9, name: 'A eliminar' }]);
    apiMock.deleteBranch.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findByText('A eliminar');

    const deleteButton = container.querySelector('button.text-red-500');
    await user.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.deleteBranch).toHaveBeenCalledWith(9));
  });

  it('no elimina si el usuario cancela la confirmación', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([{ id: 9, name: 'A eliminar' }]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { container } = renderPage();
    await screen.findByText('A eliminar');

    const deleteButton = container.querySelector('button.text-red-500');
    await user.click(deleteButton as HTMLButtonElement);

    expect(apiMock.deleteBranch).not.toHaveBeenCalled();
  });

  it('muestra toast de error si falla la creación', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ user: { id: 1, store_id: 1 } });
    apiMock.getBranches.mockResolvedValue([]);
    apiMock.createBranch.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('no se pudo crear');

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Sucursal' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await user.type(nameInput, 'Sucursal X');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('no se pudo crear'));
  });
});
