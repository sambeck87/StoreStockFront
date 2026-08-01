import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StoresPage } from './StoresPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getStores: vi.fn(),
  createStore: vi.fn(),
  updateStore: vi.fn(),
  deleteStore: vi.fn(),
  getErrorMessage: vi.fn(),
}));
const toastMock = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('../../api', () => ({ api: apiMock }));
vi.mock('react-toastify', () => ({ toast: toastMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/stores']}>
      <Routes>
        <Route path="/stores" element={<StoresPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('StoresPage', () => {
  beforeEach(() => {
    apiMock.getStores.mockReset();
    apiMock.createStore.mockReset();
    apiMock.updateStore.mockReset();
    apiMock.deleteStore.mockReset();
    apiMock.getErrorMessage.mockReset();
    toastMock.error.mockReset();
    vi.restoreAllMocks();
  });

  it('lista las tiendas obtenidas de la API', async () => {
    apiMock.getStores.mockResolvedValue([
      { id: 1, name: 'Tienda Centro', manager_name: 'Ana' },
      { id: 2, name: 'Tienda Norte', manager_name: null },
    ]);

    renderPage();
    expect(await screen.findByText('Tienda Centro')).toBeInTheDocument();
    expect(screen.getByText('Tienda Norte')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('valida que el nombre sea obligatorio al crear', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([]);

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Tienda' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    expect(apiMock.createStore).not.toHaveBeenCalled();
  });

  it('crea una tienda nueva', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([]);
    apiMock.createStore.mockResolvedValue({ id: 3, name: 'Nueva Tienda' });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Tienda' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await user.type(nameInput, 'Tienda Nueva');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(apiMock.createStore).toHaveBeenCalledWith({ name: 'Tienda Nueva' }));
    expect(apiMock.getStores).toHaveBeenCalled();
  });

  it('edita una tienda existente', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([{ id: 5, name: 'Tienda Antigua' }]);
    apiMock.updateStore.mockResolvedValue({ id: 5, name: 'Tienda Renombrada' });

    const { container } = renderPage();
    await screen.findByText('Tienda Antigua');

    const editButton = container.querySelector('tbody button');
    expect(editButton).not.toBeNull();
    await user.click(editButton as HTMLButtonElement);

    const nameInput = screen.getByDisplayValue('Tienda Antigua');
    await user.clear(nameInput);
    await user.type(nameInput, 'Tienda Renombrada');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(apiMock.updateStore).toHaveBeenCalledWith(5, { name: 'Tienda Renombrada' }));
  });

  it('elimina una tienda tras confirmar', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([{ id: 9, name: 'A eliminar' }]);
    apiMock.deleteStore.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { container } = renderPage();
    await screen.findByText('A eliminar');

    const deleteButton = container.querySelectorAll('tbody button')[1];
    await user.click(deleteButton as HTMLButtonElement);

    await waitFor(() => expect(apiMock.deleteStore).toHaveBeenCalledWith(9));
  });

  it('no elimina si el usuario cancela la confirmación', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([{ id: 9, name: 'A eliminar' }]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const { container } = renderPage();
    await screen.findByText('A eliminar');

    const deleteButton = container.querySelector('button.text-red-500');
    await user.click(deleteButton as HTMLButtonElement);

    expect(apiMock.deleteStore).not.toHaveBeenCalled();
  });

  it('muestra toast de error si falla el guardado', async () => {
    const user = userEvent.setup();
    apiMock.getStores.mockResolvedValue([]);
    apiMock.createStore.mockRejectedValue(new Error('x'));
    apiMock.getErrorMessage.mockReturnValue('no se pudo crear');

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nueva Tienda' }));
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    await user.type(nameInput, 'Tienda X');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith('no se pudo crear'));
  });
});
