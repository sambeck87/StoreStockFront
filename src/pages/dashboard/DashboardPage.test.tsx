import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import '../../i18n';

const useAuthMock = vi.hoisted(() => vi.fn());
const apiMock = vi.hoisted(() => ({
  getBranches: vi.fn(),
  getUsers: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('../../api', () => ({ api: apiMock }));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiMock.getBranches.mockReset();
    apiMock.getUsers.mockReset();
    vi.restoreAllMocks();
  });

  it('muestra stats de sucursales y usuarios con ambos permisos', async () => {
    useAuthMock.mockReturnValue({ permissionResources: { user: ['index'], branch: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    apiMock.getUsers.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    renderPage();

    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total de Sucursales')).toBeInTheDocument();
    expect(screen.getByText('Total de Usuarios')).toBeInTheDocument();
  });

  it('solo llama a getBranches cuando no hay permiso de usuarios', async () => {
    useAuthMock.mockReturnValue({ permissionResources: { branch: ['index'] } });
    apiMock.getBranches.mockResolvedValue([{ id: 1 }]);

    renderPage();

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(apiMock.getUsers).not.toHaveBeenCalled();
    expect(screen.queryByText('Total de Usuarios')).not.toBeInTheDocument();
  });

  it('no muestra tarjetas ni hace fetch sin permisos', async () => {
    useAuthMock.mockReturnValue({ permissionResources: {} });

    renderPage();

    expect(await screen.findByText('Panel de Control')).toBeInTheDocument();
    expect(apiMock.getBranches).not.toHaveBeenCalled();
    expect(apiMock.getUsers).not.toHaveBeenCalled();
    expect(screen.queryByText('Total de Sucursales')).not.toBeInTheDocument();
    expect(screen.queryByText('Total de Usuarios')).not.toBeInTheDocument();
  });
});
