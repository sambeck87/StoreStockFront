import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CategoriesPage } from './CategoriesPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

const meta = { page: 1, per_page: 20, total: 2, total_pages: 1 };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/categories']}>
      <Routes>
        <Route path="/categories" element={<CategoriesPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getCategories.mockReset();
    apiMock.createCategory.mockReset();
    apiMock.updateCategory.mockReset();
    apiMock.deleteCategory.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista las categorías paginadas', async () => {
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({
      categories: [{ id: 1, name: 'Bebidas', active: true }, { id: 2, name: 'Snacks', active: false }],
      meta,
    });

    renderPage();
    expect(await screen.findByText('Bebidas')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('muestra el mensaje de sin permiso', () => {
    useAuthMock.mockReturnValue({ permissionResources: {} });

    renderPage();

    expect(
      screen.getByText('Aún no cuentas con permisos suficientes para acceder a esta sección.')
    ).toBeInTheDocument();
  });

  it('valida el nombre obligatorio al crear', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({ categories: [], meta });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Categoría' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(apiMock.createCategory).not.toHaveBeenCalled();
  });

  it('crea una categoría activa', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({ categories: [], meta });
    apiMock.createCategory.mockResolvedValue({ id: 3, name: 'Lácteos', active: true });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Categoría' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await user.type(nameInput, 'Lácteos');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(apiMock.createCategory).toHaveBeenCalledWith({ name: 'Lácteos', active: true }));
  });

  it('edita una categoría existente', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 5, name: 'Antigua', active: true }], meta });
    apiMock.updateCategory.mockResolvedValue({ id: 5, name: 'Renombrada', active: true });

    const { container } = renderPage();
    await screen.findByText('Antigua');

    const editButton = container.querySelector('tbody button');
    await user.click(editButton as HTMLButtonElement);

    const nameInput = screen.getByDisplayValue('Antigua');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renombrada');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(apiMock.updateCategory).toHaveBeenCalledWith(5, { name: 'Renombrada', active: true }));
  });

  it('elimina una categoría tras confirmar', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({ categories: [{ id: 9, name: 'A eliminar', active: true }], meta });
    apiMock.deleteCategory.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findByText('A eliminar');

    const deleteButton = container.querySelector('button.text-red-500');
    await user.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.deleteCategory).toHaveBeenCalledWith(9));
  });

  it('muestra toast de error si falla el guardado', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ permissionResources: { category: ['index'] } });
    apiMock.getCategories.mockResolvedValue({ categories: [], meta });
    apiMock.createCategory.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('no se pudo crear');

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Categoría' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await user.type(nameInput, 'Cat X');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('no se pudo crear'));
  });
});
