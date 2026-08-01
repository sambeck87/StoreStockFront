import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes';

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('../contexts/AuthContext', () => ({
  useAuth: useAuthMock,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>login-page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/inventory" element={<div>protected-page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('muestra un spinner mientras carga', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });
    renderAt('/inventory');
    expect(screen.queryByText('protected-page')).not.toBeInTheDocument();
  });

  it('redirige a /login cuando no hay usuario', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });
    renderAt('/inventory');
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('renderiza la ruta protegida cuando hay usuario', () => {
    useAuthMock.mockReturnValue({ user: { id: 1 }, isLoading: false });
    renderAt('/inventory');
    expect(screen.getByText('protected-page')).toBeInTheDocument();
  });
});
