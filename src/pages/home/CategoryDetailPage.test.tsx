import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CategoryDetailPage } from './CategoryDetailPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getCategory: vi.fn(),
  getBranches: vi.fn(),
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
    <MemoryRouter initialEntries={['/categories/1']}>
      <Routes>
        <Route path="/categories/:id" element={<CategoryDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function mockBaseData() {
  apiMock.getCategory.mockResolvedValue({ id: 1, name: 'Bebidas', active: true });
  apiMock.getBranches.mockResolvedValue([{ id: 2, name: 'Sucursal A' }]);
  apiMock.getCategoryItems.mockResolvedValue({ items: [item], meta });
}

describe('CategoryDetailPage', () => {
  beforeEach(() => {
    Object.values(apiMock).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('carga la categoría y lista sus artículos por sucursal', async () => {
    mockBaseData();

    renderPage();

    expect(await screen.findByText('Bebidas')).toBeInTheDocument();
    expect((await screen.findAllByDisplayValue('Coca Cola')).length).toBeGreaterThan(0);
    expect(apiMock.getCategoryItems).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ branch_id: 2, active: true, page: 1, per_page: 20 })
    );
  });

  it('muestra estado vacío sin artículos', async () => {
    mockBaseData();
    apiMock.getCategoryItems.mockResolvedValue({ items: [], meta: { ...meta, total: 0 } });

    renderPage();

    expect(await screen.findByText('No hay artículos')).toBeInTheDocument();
  });

  it('guarda cambios inline en un artículo', async () => {
    const u = userEvent.setup();
    mockBaseData();
    apiMock.updateItem.mockResolvedValue({ ...item, name: 'Coca Cola Zero' });

    const { container } = renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const nameInput = screen.getAllByDisplayValue('Coca Cola')[0] as HTMLInputElement;
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
    mockBaseData();
    apiMock.updateItem.mockResolvedValue({ ...item, active: false });

    renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    const toggle = screen.getAllByText('Activo').map((el) => el.closest('button')).filter(Boolean)[0] as HTMLButtonElement;
    await u.click(toggle);

    await waitFor(() =>
      expect(apiMock.updateItem).toHaveBeenCalledWith(1, expect.objectContaining({ active: false, branch_id: 2 }))
    );
  });

  it('crea un artículo nuevo con la categoría y sucursal por defecto', async () => {
    const u = userEvent.setup();
    mockBaseData();
    apiMock.createItem.mockResolvedValue({ id: 9, name: 'Agua', active: true });

    const { container } = renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

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

  it('valida el nombre obligatorio al crear', async () => {
    const u = userEvent.setup();
    mockBaseData();

    renderPage();
    await screen.findAllByDisplayValue('Coca Cola');

    await u.click(screen.getByRole('button', { name: 'Nuevo Artículo' }));
    await u.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(toastMock.error).toHaveBeenCalledWith('El nombre es requerido');
    expect(apiMock.createItem).not.toHaveBeenCalled();
  });

  it('elimina un artículo tras confirmar', async () => {
    const u = userEvent.setup();
    mockBaseData();
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
