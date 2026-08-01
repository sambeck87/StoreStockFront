import { describe, expect, it, vi, beforeEach } from 'vitest';
import esRaw from './locales/es.json?raw';
import enRaw from './locales/en.json?raw';
import es from './locales/es.json';
import en from './locales/en.json';

type JsonRecord = Record<string, unknown>;

function flattenKeys(obj: JsonRecord, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? flattenKeys(v as JsonRecord, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );
}

function findDuplicateKeys(text: string): string[] {
  const dups: string[] = [];
  let i = 0;
  const isWs = (c: string) => c === ' ' || c === '\n' || c === '\t' || c === '\r';
  const skipWs = () => {
    while (i < text.length && isWs(text[i])) i++;
  };
  const readString = (): string => {
    i++;
    let s = '';
    while (i < text.length && text[i] !== '"') {
      if (text[i] === '\\') {
        s += text[i + 1];
        i += 2;
      } else {
        s += text[i];
        i++;
      }
    }
    i++;
    return s;
  };
  const readPrimitive = () => {
    while (i < text.length && !isWs(text[i]) && !',}]'.includes(text[i])) i++;
  };
  const readValue = (): void => {
    skipWs();
    const c = text[i];
    if (c === '{') readObject();
    else if (c === '[') {
      i++;
      skipWs();
      if (text[i] === ']') {
        i++;
        return;
      }
      while (true) {
        readValue();
        skipWs();
        if (text[i] === ',') {
          i++;
          skipWs();
          continue;
        }
        if (text[i] === ']') {
          i++;
          return;
        }
        throw new Error('JSON inválido');
      }
    } else if (c === '"') readString();
    else readPrimitive();
  };
  const readObject = (): void => {
    const seen = new Set<string>();
    i++;
    skipWs();
    if (text[i] === '}') {
      i++;
      return;
    }
    while (true) {
      skipWs();
      const key = readString();
      if (seen.has(key)) dups.push(key);
      seen.add(key);
      skipWs();
      i++;
      readValue();
      skipWs();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === '}') {
        i++;
        return;
      }
      throw new Error('JSON inválido');
    }
  };
  readValue();
  return dups;
}

describe('Integridad de traducciones', () => {
  it('no tiene claves duplicadas en es.json', () => {
    expect(findDuplicateKeys(esRaw)).toEqual([]);
  });

  it('no tiene claves duplicadas en en.json', () => {
    expect(findDuplicateKeys(enRaw)).toEqual([]);
  });

  it('es y en tienen exactamente la misma estructura de claves', () => {
    const esKeys = flattenKeys(es).sort();
    const enKeys = flattenKeys(en).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('no deja traducciones vacías ni de solo espacios', () => {
    const values = Object.entries({ ...flatten(es), ...flatten(en) });
    const empty = values.filter(([, v]) => typeof v === 'string' && v.trim() === '');
    expect(empty).toEqual([]);
  });

  it('pagination.showing conserva los placeholders de interpolación en ambos idiomas', () => {
    expect(es.pagination.showing).toContain('{{from}}');
    expect(es.pagination.showing).toContain('{{to}}');
    expect(es.pagination.showing).toContain('{{total}}');
    expect(en.pagination.showing).toContain('{{from}}');
    expect(en.pagination.showing).toContain('{{to}}');
    expect(en.pagination.showing).toContain('{{total}}');
  });
});

function flatten(obj: JsonRecord, prefix = ''): JsonRecord {
  return Object.entries(obj).reduce<JsonRecord>((acc, [k, v]) => {
    const key = `${prefix}${k}`;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(acc, flatten(v as JsonRecord, `${key}.`));
    } else {
      acc[key] = v;
    }
    return acc;
  }, {});
}

describe('Runtime de i18n', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('usa español por defecto', async () => {
    const { default: i18n } = await import('./index');
    expect(i18n.language).toBe('es');
    expect(i18n.t('app.title')).toBe('Gestión de Inventario');
  });

  it('respeta el idioma guardado en localStorage', async () => {
    localStorage.setItem('language', 'en');
    const { default: i18n } = await import('./index');
    expect(i18n.language).toBe('en');
    expect(i18n.t('app.title')).toBe('Inventory Management');
  });

  it('changeLanguage cambia las traducciones', async () => {
    const { default: i18n } = await import('./index');
    await i18n.changeLanguage('en');
    expect(i18n.t('auth.login')).toBe('Login');
    await i18n.changeLanguage('es');
    expect(i18n.t('auth.login')).toBe('Iniciar Sesión');
  });

  it('usa fallbackLng=es para claves ausentes en el idioma activo', async () => {
    const { default: i18n } = await import('./index');
    await i18n.changeLanguage('en');
    expect(i18n.t('app.name')).toBe('StoreStock');
  });
});
