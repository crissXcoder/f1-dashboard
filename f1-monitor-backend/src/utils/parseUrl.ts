import { parse as parseCoreUrl } from 'url';

/**
 * Parsea una URL cruda (de req.url) y retorna pathname + URLSearchParams.
 * No resuelve base; asume paths absolutos típicos de HTTP ("/ruta?x=1").
 */
export function parseUrl(rawUrl: string | undefined): {
    pathname: string;
    query: URLSearchParams;
} {
    const parsed = parseCoreUrl(rawUrl ?? '/', false);
    const pathname = parsed.pathname ?? '/';
    // parsed.search incluye el '?' inicial; si es undefined, usamos cadena vacía
    const search = parsed.search ?? '';
    const query = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return { pathname, query };
}
