import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BranchDetailPage } from './BranchDetailPage';
import '../../i18n';

const apiMock = vi.hoisted(() => ({
  getBranchCategories: vi.fn(),
}));

vi.mock('../../api', () => ({ api: apiMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/branches/5']}>
      <Routes>
        <Route path="/branches/:id" element={<BranchDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BranchDetailPage', () => {
  beforeEach(() => {
    apiMock.getBranchCategories.mockReset();
    vi.restoreAllMocks();
  });

  it('lista las categorías de la sucursal', async () => {
    apiMock.getBranchCategories.mockResolvedValue([
      { id: 1, name: 'Bebidas', description: 'Refrescos y jugos' },
      { id: 2, name: 'Snacks' },
    ]);

    renderPage();

    expect(await screen.findByText('Bebidas')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Refrescos y jugos')).toBeInTheDocument();
    expect(apiMock.getBranchCategories).toHaveBeenCalledWith(5);
  });

  it('muestra estado vacío cuando no hay categorías', async () => {
    apiMock.getBranchCategories.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('No hay categorías')).toBeInTheDocument();
  });
});
