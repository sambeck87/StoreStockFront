# Store Stock — Frontend

Aplicación web de gestión de inventario, sucursales, tiendas, usuarios, roles y permisos. Frontend construido con **React 19**, **TypeScript**, **Vite** y **Tailwind CSS 4**, con autenticación JWT, multi-idioma (español/inglés) y panel de administración.

## Características

- **Autenticación**: registro, inicio de sesión, confirmación de email, recuperación y restablecimiento de contraseña (JWT Bearer).
- **Panel de administración**: gestión de usuarios, roles, permisos globales, tiendas, sucursales, categorías e inventario.
- **Vista pública**: catálogo de tiendas, sucursales, categorías y artículos con filtros y paginación.
- **Inventario**: filtrado por sucursal/categoría, estados de cantidad, exportación y descarga (CSV/Excel vía API).
- **Multi-idioma**: español (por defecto) e inglés, seleccionable y persistido en `localStorage`.
- **Tema claro/oscuro** y UI responsiva con animaciones (Framer Motion).
- **Sesión segura**: interceptor de Axios que inyecta el token y detecta expiración (401 → redirección a login).

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Estilos | Tailwind CSS 4 |
| Datos / HTTP | TanStack Query + Axios |
| Rutas | React Router 7 |
| i18n | i18next / react-i18next |
| UI | lucide-react, framer-motion, react-toastify |

## Requisitos

- **Node.js** ≥ 20 (recomendado: Node 22 LTS, usado en el `Dockerfile`)
- **npm** ≥ 10
- La **API backend** corriendo y accesible (por defecto en `http://localhost:3000`)

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio> store_stock_front
cd store_stock_front
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el ejemplo y ajústalo a tu entorno:

```bash
cp .env.example .env
```

| Variable | Obligatoria | Descripción | Ejemplo |
| --- | --- | --- | --- |
| `VITE_API_URL` | Sí | URL base de la API backend (incluye el prefijo `/api/v1`). Todos los endpoints se resuelven contra esta URL. | `http://localhost:3000/api/v1` |

> **Nota de seguridad**: en producción la URL debe apuntar a un dominio HTTPS público de la API (p. ej. `https://api.tudominio.com/api/v1`) y nunca al localhost.
>
> **Fallback del proxy de desarrollo**: si `VITE_API_URL` no está definida, el frontend usa `/api/v1` como base. En desarrollo, Vite redirige las peticiones `/api` hacia `http://localhost:3000` (ver `vite.config.ts`). Si defines `VITE_API_URL`, se usa directamente y el proxy no interviene.

Solo existe **una** variable de entorno en la aplicación (`VITE_API_URL`). Las variables con prefijo `VITE_` se exponen al cliente en tiempo de build; cualquier otra variable del sistema no será visible para el bundle.

### 4. Levantar en desarrollo

```bash
npm run dev
```

La app arranca en `http://localhost:3001` con recarga en caliente (HMR).

> Cambia el puerto en `server.port` de `vite.config.ts` si está ocupado.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR en el puerto `3001` |
| `npm run build` | Compila TypeScript y genera el bundle de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción (`dist/`) |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm run test` | Ejecuta la suite de tests (Vitest + Testing Library) |
| `npm run test:watch` | Ejecuta los tests en modo watch |
| `npm run test:coverage` | Ejecuta los tests con reporte de cobertura (V8) |

## Testing

La suite (Vitest + Testing Library + jsdom) cubre todo el proyecto: cliente de API (baseURL, inyección de JWT, manejo de 401), validación de formularios, autenticación y permisos (`AuthContext`), tema, rutas protegidas, páginas de auth, componentes comunes, todas las páginas de dashboard (tiendas, sucursales, usuarios, categorías, inventario, permisos), la vista pública (catálogo, sucursales, categorías y artículos) y la paridad de traducciones es/en (incluye detección de claves duplicadas en los JSON de i18n).

```bash
npm run test           # ejecutar una vez
npm run test:watch     # desarrollo
npm run test:coverage  # con reporte de cobertura en consola y coverage/
```

> Estado actual: **25 archivos de test, 161 casos**, cobertura de ~71% en statements y ~76% en líneas. Puedes regenerar el reporte con `npm run test:coverage`.

## Build de producción

```bash
npm run build
npm run preview        # probar localmente el bundle generado
```

El resultado queda en `dist/`, listo para servirse con cualquier servidor estático o contenedor (ver Docker).

## Despliegue

### Opción A — Docker (recomendado)

El proyecto incluye un `Dockerfile` de **multi-stage** que compila la app con Node y la sirve con **Nginx**.

```bash
# Build de la imagen
docker build -t store-stock-front .

# Ejecutar el contenedor (expone Nginx en el puerto 80)
docker run -d -p 8080:80 store-stock-front
```

> `VITE_API_URL` se inyecta en tiempo de build (las variables `VITE_` se resuelven en el bundle estático), no en el contenedor. Si necesitas apuntar a distintas APIs por entorno, pasa el valor en el build:

```bash
docker build --build-arg VITE_API_URL=https://api.tudominio.com/api/v1 -t store-stock-front .
```

> El `--build-arg` requiere declarar `ARG VITE_API_URL` en el `Dockerfile` (sección "Build args"). Alternativa más simple: fijar `VITE_API_URL` en un `.env` o variable de entorno del proceso de build antes de ejecutar `docker build`.

### Opción B — Nginx directo

Súbete el contenido de `dist/` junto con el `nginx.conf` incluido (SPA fallback a `index.html`):

```bash
npm run build
rsync -av dist/ usuario@servidor:/var/www/store-stock/
# copia también nginx.conf y recarga Nginx
```

## Configuración de Nginx

El `nginx.conf` incluido:

- Sirve `index.html` con **fallback SPA** (`try_files $uri /index.html`), necesario para que React Router funcione en refresco de cualquier ruta.
- Bloquea el acceso directo a los assets inexistentes (`/assets/` → `404`).
- En producción, redirige o proxya `/api` hacia el backend (agrega un bloque `location /api` con `proxy_pass` si la API está en otro host).

## Estructura del proyecto

```
├── src/
│   ├── api/            # Cliente Axios e integración con el backend
│   ├── components/
│   │   ├── common/     # UI reutilizable (Button, Modal, Table, Input, Pagination…)
│   │   └── layout/     # Layout general de la aplicación
│   ├── contexts/       # AuthContext, ThemeContext
│   ├── i18n/           # Configuración y traducciones (es/en)
│   ├── pages/
│   │   ├── auth/       # Login, registro, recuperación de contraseña…
│   │   ├── dashboard/  # Panel de administración
│   │   └── home/       # Vista pública (catálogo)
│   ├── types/          # Tipos de TypeScript compartidos
│   ├── utils/          # Rutas protegidas, validaciones
│   ├── App.tsx
│   └── main.tsx
├── Dockerfile          # Build multi-stage (Node → Nginx)
├── nginx.conf          # Configuración de servidor Nginx
└── vite.config.ts      # Configuración de Vite (puerto 3001, proxy /api)
```

## API

El backend expone endpoints REST bajo `/api/v1` (sessions, registration, stores, branches, categories, items, inventory, users, roles, global_permissions, confirmations). El frontend se comunica mediante JWT: el token se almacena en `localStorage` y se envía como `Authorization: Bearer <token>`. Ante una respuesta `401`, la app cierra la sesión automáticamente.

**Repositorio de la API**: [github.com/sambeck87/StoreStockAPI](https://github.com/sambeck87/StoreStockAPI)
