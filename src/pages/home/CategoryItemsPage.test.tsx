import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CategoryItemsPage } from './CategoryItemsPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getCategory: vi.fn(),
  getUserBranches: vi.fn(),
  getBranchItems: vi.fn(),
  getCategoryItems: vi.fn(),
  updateItem: vi.fn(),
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };

const item = {
  id: 1,
  name: 'Coca Cola',
  measure: 'lt',
  current_quantity: 10,
  minimum_quantity: 5,
  cost: 15.5,
  active: true,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/categories/1/items']}>
      <Routes>
        <Route path="/categories/:id/items" element={<CategoryItemsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CategoryItemsPage', () => {
  beforeEach(() => {
    Object.values(apiMock).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('carga la categoría y lista los artículos de la sucursal principal', async () => {
    apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
    apiMock.getUserBranches.mockResolvedValue([
      { id: 2, name: 'Sucursal A', is_main: true },
      { id: 3, name: 'Sucursal B' },
    ]);
    apiMock.getBranchItems.mockResolvedValue({ items: [item], meta });

    renderPage();

    expect(await screen.findByText('Bebidas')).toBeInTheDocument();
    expect((await screen.findAllByDisplayValue('Coca Cola')).length).toBeGreaterThan(0);
    expect(apiMock.getBranchItems).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ category_id: 1, active: true, page: 1, per_page: 20 })
    );
  });

  it('usa getCategoryItems cuando no hay sucursales', async () => {
    apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
    apiMock.getUserBranches.mockResolvedValue([]);
    apiMock.getCategoryItems.mockResolvedValue({ items: [], meta: { ...meta, total: 0 } });

    renderPage();

    expect(await screen.findByText('No hay artículos')).toBeInTheDocument();
    expect(apiMock.getCategoryItems).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ active: true, page: 1, per_page: 20 })
    );
  });

  it('crea un artículo nuevo con la categoría y sucursal', async () => {
    const u = userEvent.setup();
    apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
    apiMock.getUserBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A', is_main: true }]);
    apiMock.getBranchItems.mockResolvedValue({ items: [], meta: { ...meta, total: 0 } });
    apiMock.createItem.mockResolvedValue({ id: 9, name: 'Agua', active: true });

    const { container } = renderPage();
    await screen.findByText('No hay artículos');

    await u.click(screen.getByRole('button', { name: 'Nuevo Artículo' }));

    const modal = container.querySelector('.fixed') as HTMLElement;
    const nameInput = within(modal).getAllByRole('textbox')[0] as HTMLInputElement;
    await u.type(nameInput, 'Agua');
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(apiMock.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Agua', active: true, branch_id: 2, category_id: 1 })
      )
    );
  });

  it('alterna el estado activo de un artículo', async () => {
    const u = userEvent.setup();
    apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
    apiMock.getUserBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A', is_main: true }]);
    apiMock.getBranchItems.mockResolvedValue({ items: [item], meta });
    apiMock.updateItem.mockResolvedValue({ ...item, active: false });

    renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const toggle = screen.getAllByText('Activo').map((el) => el.closest('button')).filter(Boolean)[0] as HTMLButtonElement;
    await u.click(toggle);

    await waitFor(() =>
      expect(apiMock.updateItem).toHaveBeenCalledWith(1, expect.objectContaining({ active: false, branch_id: 2 }))
    );
  });

  it('elimina un artículo tras confirmar', async () => {
    const u = userEvent.setup();
    apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
    apiMock.getUserBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A', is_main: true }]);
    apiMock.getBranchItems.mockResolvedValue({ items: [item], meta });
    apiMock.deleteItem.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const deleteButton = container.querySelector('svg.lucide-trash-2')?.closest('button') as HTMLButtonElement;
    await u.click(deleteButton);

    await waitFor(() =>
      expect(apiMock.deleteItem).toHaveBeenCalledWith(1, expect.objectContaining({ branch_id: 2, category_id: 1 }))
    );
  });
});
