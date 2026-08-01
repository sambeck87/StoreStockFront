import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StoreSelectPage } from './StoreSelectPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getStores: vi.fn(),
  createStore: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/store-select']}>
      <Routes>
        <Route path="/store-select" element={<StoreSelectPage />} />
        <Route path="/inventory" element={<div>inventory-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('StoreSelectPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getStores.mockReset();
    apiMock.createStore.mockReset();
    apiMock.updateUser.mockReset();
  });

  it('lista las tiendas y permite seleccionar una para continuar', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();
    useAuthMock.mockReturnValue({ user: { id: 1, email: 'a@b.c' }, updateUser });
    apiMock.getStores.mockResolvedValue([
      { id: 1, name: 'Tienda A', address: 'Av. 1' },
      { id: 2, name: 'Tienda B' },
    ]);
    apiMock.updateUser.mockResolvedValue({ id: 1, email: 'a@b.c', store_id: 1 });

    renderPage();
    expect(await screen.findByText('Tienda A')).toBeInTheDocument();
    expect(screen.getByText('Tienda B')).toBeInTheDocument();

    await user.click(screen.getByText('Tienda A'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(apiMock.updateUser).toHaveBeenCalledWith(1, { store_id: 1 }));
    expect(updateUser).toHaveBeenCalled();
    expect(await screen.findByText('inventory-page')).toBeInTheDocument();
  });

  it('crea una tienda nueva y navega al inventario', async () => {
    const user = userEvent.setup();
    const updateUser = vi.fn();
    useAuthMock.mockReturnValue({ user: { id: 1, email: 'a@b.c' }, updateUser });
    apiMock.getStores.mockResolvedValue([]);
    apiMock.createStore.mockResolvedValue({ id: 9, name: 'Nueva Tienda' });
    apiMock.updateUser.mockResolvedValue({ id: 1, email: 'a@b.c', store_id: 9 });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Crear Nueva Tienda' }));
    await user.type(screen.getByPlaceholderText('Ej: Mi Tienda'), 'Nueva Tienda');
    await user.click(screen.getByRole('button', { name: 'Nueva Tienda' }));

    await waitFor(() => expect(apiMock.createStore).toHaveBeenCalledWith({ name: 'Nueva Tienda' }));
    expect(apiMock.updateUser).toHaveBeenCalledWith(1, { store_id: 9 });
    expect(await screen.findByText('inventory-page')).toBeInTheDocument();
  });

  it('muestra error al fallar la selección de tienda', async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    useAuthMock.mockReturnValue({ user: { id: 1, email: 'a@b.c' }, updateUser: vi.fn() });
    apiMock.getStores.mockResolvedValue([{ id: 1, name: 'Tienda A' }]);
    apiMock.updateUser.mockRejectedValue(new Error('nope'));

    renderPage();
    await user.click(await screen.findByText('Tienda A'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Error al seleccionar la tienda')).toBeInTheDocument();
    logSpy.mockRestore();
  });
});
