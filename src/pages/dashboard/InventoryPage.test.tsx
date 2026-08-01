import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InventoryPage } from './InventoryPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getBranches: vi.fn(),
  getCategories: vi.fn(),
  getInventory: vi.fn(),
  updateItem: vi.fn(),
  createInventoryExport: vi.fn(),
  getInventoryExport: vi.fn(),
  downloadInventoryExport: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };

const item = {
  id: 1,
  name: 'Coca Cola',
  branch_id: 2,
  branch_name: 'Sucursal A',
  category_id: 3,
  category_name: 'Bebidas',
  measure: 'lt',
  current_quantity: 10,
  minimum_quantity: 5,
  active: true,
};

function renderPage(initialEntries = ['/inventory']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/inventory" element={<InventoryPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('InventoryPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    Object.values(apiMock).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista el inventario con sus filtros', async () => {
    useAuthMock.mockReturnValue({ permissionResources: { item: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A' }]);
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 3, name: 'Bebidas' }], meta });
    apiMock.getInventory.mockResolvedValue({ items: [item], meta });

    renderPage();

    expect((await screen.findAllByDisplayValue('Coca Cola')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sucursal A').length).toBeGreaterThan(0);
    expect(apiMock.getInventory).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 20, active: 'true' })
    );
  });

  it('muestra el estado de sin permiso', () => {
    useAuthMock.mockReturnValue({ permissionResources: {} });

    renderPage();

    expect(
      screen.getByText('Aún no cuentas con permisos suficientes para acceder a esta sección.')
    ).toBeInTheDocument();
  });

  it('guarda una fila editada de forma inline', async () => {
    const u = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { item: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A' }]);
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 3, name: 'Bebidas' }], meta });
    apiMock.getInventory.mockResolvedValue({ items: [item], meta });
    apiMock.updateItem.mockResolvedValue({ ...item, name: 'Coca Cola Zero' });

    const { container } = renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await u.clear(nameInput);
    await u.type(nameInput, 'Coca Cola Zero');

    const saveButton = container.querySelector('svg.lucide-save')?.closest('button') as HTMLButtonElement;
    await u.click(saveButton);

    await waitFor(() =>
      expect(apiMock.updateItem).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Coca Cola Zero', branch_id: 2 })
      )
    );
  });

  it('alterna el estado activo de un artículo', async () => {
    const u = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { item: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A' }]);
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 3, name: 'Bebidas' }], meta });
    apiMock.getInventory.mockResolvedValue({ items: [item], meta });
    apiMock.updateItem.mockResolvedValue({ ...item, active: false });

    renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const toggle = screen.getAllByText('Activo').map((el) => el.closest('button')).filter(Boolean)[0] as HTMLButtonElement;
    await u.click(toggle);

    await waitFor(() =>
      expect(apiMock.updateItem).toHaveBeenCalledWith(1, expect.objectContaining({ active: false, branch_id: 2 }))
    );
  });

  it('limpia los filtros aplicados', async () => {
    const u = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { item: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A' }]);
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 3, name: 'Bebidas' }], meta });
    apiMock.getInventory.mockResolvedValue({ items: [item], meta });

    renderPage(['/inventory?branch_id=2&active=true']);

    await screen.findAllByDisplayValue('Coca Cola');
    expect(screen.getByText('Limpiar filtros')).toBeInTheDocument();

    await u.click(screen.getByText('Limpiar filtros'));

    await waitFor(() =>
      expect(apiMock.getInventory).toHaveBeenLastCalledWith(
        expect.objectContaining({ active: 'true' })
      )
    );
  });

  it('exporta el inventario a CSV cuando el proceso completa', async () => {
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:x'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });

    vi.useFakeTimers();
    useAuthMock.mockReturnValue({ permissionResources: { item: ['index'] } });
    apiMock.getBranches.mockResolvedValue([]);
    apiMock.getCategories.mockResolvedValue({ categories: [], meta });
    apiMock.getInventory.mockResolvedValue({ items: [], meta });
    apiMock.createInventoryExport.mockResolvedValue({
      id: 42,
      status: 'processing',
      filters: {},
      error_message: null,
      download_url: null,
      created_at: '',
    });
    apiMock.getInventoryExport.mockResolvedValue({
      id: 42,
      status: 'completed',
      filters: {},
      error_message: null,
      download_url: null,
      created_at: '',
    });
    apiMock.downloadInventoryExport.mockResolvedValue(new Blob(['a,b']));

    renderPage();

    fireEvent.click(screen.getByText('Exportar CSV'));
    await act(async () => {});
    expect(apiMock.createInventoryExport).toHaveBeenCalledWith({ active: 'true' });

    await vi.advanceTimersByTimeAsync(2100);

    expect(apiMock.downloadInventoryExport).toHaveBeenCalledWith(42);
    vi.useRealTimers();
  });
});
