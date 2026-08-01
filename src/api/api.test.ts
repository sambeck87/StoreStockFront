import { beforeEach, describe, expect, it, vi } from 'vitest';

interface RequestConfig {
  headers?: Record<string, string>;
  url?: string;
  [key: string]: unknown;
}

interface ApiErrorLike {
  response?: { status?: number; data?: unknown };
  config?: { url?: string };
  isAxiosError?: boolean;
  message?: string;
}

const h = vi.hoisted(() => {
  const requestHandlers: Array<(config: RequestConfig) => RequestConfig> = [];
  let errorHandler: ((error: unknown) => Promise<unknown>) | null = null;
  let createConfig: { baseURL?: string } | null = null;
  return {
    requestHandlers,
    get errorHandler() {
      return errorHandler;
    },
    setErrorHandler(fn: ((error: unknown) => Promise<unknown>) | null) {
      errorHandler = fn;
    },
    get createConfig() {
      return createConfig;
    },
    setCreateConfig(cfg: { baseURL?: string } | null) {
      createConfig = cfg;
    },
  };
});

vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: (config: { baseURL?: string }) => {
      h.setCreateConfig(config);
      return {
        interceptors: {
          request: {
            use: (fn: (config: RequestConfig) => RequestConfig) => {
              h.requestHandlers.push(fn);
            },
          },
          response: {
            use: (
              _ok: (response: unknown) => unknown,
              err: (error: unknown) => Promise<unknown>
            ) => {
              h.setErrorHandler(err);
            },
          },
        },
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      };
    },
    isAxiosError: (e: unknown) => (e as ApiErrorLike)?.isAxiosError === true,
  },
}));

describe('ApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.unstubAllEnvs();
    h.requestHandlers.length = 0;
    h.setErrorHandler(null);
    h.setCreateConfig(null);
  });

  it('usa /api/v1 como baseURL por defecto', async () => {
    vi.stubEnv('VITE_API_URL', '');
    await import('../api');
    expect(h.createConfig?.baseURL).toBe('/api/v1');
  });

  it('usa VITE_API_URL como baseURL cuando está definida', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/api/v1');
    await import('../api');
    expect(h.createConfig?.baseURL).toBe('https://api.example.com/api/v1');
  });

  it('inyecta el header Authorization Bearer con el token guardado', async () => {
    localStorage.setItem('token', 'secret-token');
    await import('../api');
    const config = h.requestHandlers[0]({ headers: {}, url: '/users' });
    expect(config.headers?.Authorization).toBe('Bearer secret-token');
  });

  it('no inyecta Authorization si no hay token', async () => {
    await import('../api');
    const config = h.requestHandlers[0]({ headers: {}, url: '/users' });
    expect(config.headers?.Authorization).toBeUndefined();
  });

  it('dispara auth:expired ante un 401 fuera de /sessions', async () => {
    await import('../api');
    const dispatch = vi.fn();
    window.dispatchEvent = dispatch;
    const error: ApiErrorLike = { response: { status: 401 }, config: { url: '/inventory' } };
    await expect(h.errorHandler!(error)).rejects.toBe(error);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:expired' }));
  });

  it('no dispara auth:expired para 401 en /sessions', async () => {
    await import('../api');
    const dispatch = vi.fn();
    window.dispatchEvent = dispatch;
    const error: ApiErrorLike = { response: { status: 401 }, config: { url: '/sessions' } };
    await expect(h.errorHandler!(error)).rejects.toBe(error);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('getErrorMessage extrae el message del payload de error', async () => {
    const { api } = await import('../api');
    const err: ApiErrorLike = {
      isAxiosError: true,
      response: { data: { error: { message: 'credenciales inválidas' } } },
    };
    expect(api.getErrorMessage(err)).toBe('credenciales inválidas');
  });

  it('getErrorMessage acepta error con mensaje en string', async () => {
    const { api } = await import('../api');
    const err: ApiErrorLike = { isAxiosError: true, response: { data: { error: 'fallo de red' } } };
    expect(api.getErrorMessage(err)).toBe('fallo de red');
  });

  it('getErrorMessage devuelve mensaje genérico para errores desconocidos', async () => {
    const { api } = await import('../api');
    expect(api.getErrorMessage(new Error('boom'))).toContain('salió mal');
  });
});
