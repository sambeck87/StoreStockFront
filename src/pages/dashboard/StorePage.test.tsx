import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StorePage } from './StorePage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getStore: vi.fn(),
  getStores: vi.fn(),
  updateStore: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

const store = { id: 1, name: 'Tienda Central', address: 'Av. Central', phone: '555-1234' };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/store']}>
      <Routes>
        <Route path="/store" element={<StorePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('StorePage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getStore.mockReset();
    apiMock.getStores.mockReset();
    apiMock.updateStore.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('carga y muestra la tienda asignada al usuario', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, store_id: 5 },
      hasPermission: vi.fn().mockReturnValue(false),
      permissionResources: { store: ['show'] },
    });
    apiMock.getStore.mockResolvedValue(store);

    renderPage();

    expect(await screen.findByText('Tienda Central')).toBeInTheDocument();
    expect(screen.getByText('Av. Central')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(apiMock.getStore).toHaveBeenCalledWith(5);
  });

  it('usa la primera tienda del listado cuando no hay store_id y puede ver tiendas', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1 },
      hasPermission: vi.fn().mockReturnValue(false),
      permissionResources: { store: ['index'] },
    });
    apiMock.getStores.mockResolvedValue([store]);

    renderPage();

    expect(await screen.findByText('Tienda Central')).toBeInTheDocument();
    expect(apiMock.getStore).not.toHaveBeenCalled();
  });

  it('muestra estado vacío sin tienda asignada y sin permiso', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1 },
      hasPermission: vi.fn().mockReturnValue(false),
      permissionResources: {},
    });

    renderPage();

    expect(await screen.findByText('No tienes una tienda asignada')).toBeInTheDocument();
  });

  it('muestra el error si falla la carga', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, store_id: 5 },
      hasPermission: vi.fn().mockReturnValue(false),
      permissionResources: { store: ['show'] },
    });
    apiMock.getStore.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('No se pudo cargar');

    renderPage();

    expect(await screen.findByText('No se pudo cargar')).toBeInTheDocument();
  });

  it('permite editar y guardar cuando tiene permiso de actualización', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      user: { id: 1, store_id: 5 },
      hasPermission: vi.fn().mockImplementation((res: string, act: string) => res === 'store' && act === 'update'),
      permissionResources: { store: ['show', 'update'] },
    });
    apiMock.getStore.mockResolvedValue(store);
    apiMock.updateStore.mockResolvedValue({ ...store, name: 'Tienda Renombrada' });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Editar' }));

    const nameInput = screen.getByDisplayValue('Tienda Central');
    await user.clear(nameInput);
    await user.type(nameInput, 'Tienda Renombrada');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.updateStore).toHaveBeenCalledWith(1, {
        name: 'Tienda Renombrada',
        address: 'Av. Central',
        phone: '555-1234',
      })
    );
  });

  it('no muestra el botón de editar sin permiso de actualización', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 1, store_id: 5 },
      hasPermission: vi.fn().mockReturnValue(false),
      permissionResources: { store: ['show'] },
    });
    apiMock.getStore.mockResolvedValue(store);

    renderPage();

    await screen.findByText('Tienda Central');
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('valida el nombre requerido al guardar', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      user: { id: 1, store_id: 5 },
      hasPermission: vi.fn().mockReturnValue(true),
      permissionResources: { store: ['show', 'update'] },
    });
    apiMock.getStore.mockResolvedValue(store);

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Editar' }));

    const nameInput = screen.getByDisplayValue('Tienda Central');
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(apiMock.updateStore).not.toHaveBeenCalled();
  });
});
