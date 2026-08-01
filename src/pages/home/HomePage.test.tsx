import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({ getUserBranches: vi.fn() }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/branches/:id" element={<div>branch-detail-page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getUserBranches.mockReset();
  });

  it('muestra un spinner mientras la autenticación carga', () => {
    useAuthMock.mockReturnValue({ token: null, isLoading: true });
    renderPage();
    expect(screen.queryByText('Mis Sucursales')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('muestra el estado vacío sin sucursales', async () => {
    useAuthMock.mockReturnValue({ token: 'tok', isLoading: false });
    apiMock.getUserBranches.mockResolvedValue([]);

    renderPage();
    expect(await screen.findByText('No tienes acceso a ninguna sucursal')).toBeInTheDocument();
  });

  it('lista las sucursales y navega al detalle al hacer clic', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ token: 'tok', isLoading: false });
    apiMock.getUserBranches.mockResolvedValue([
      { id: 1, name: 'Sucursal Centro', address: 'Av. Principal' },
      { id: 2, name: 'Sucursal Norte' },
    ]);

    renderPage();
    expect(await screen.findByText('Sucursal Centro')).toBeInTheDocument();
    expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();

    await user.click(screen.getByText('Sucursal Centro'));
    expect(await screen.findByText('branch-detail-page')).toBeInTheDocument();
  });
});
