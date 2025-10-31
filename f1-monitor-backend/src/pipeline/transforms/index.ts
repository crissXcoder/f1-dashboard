/**
 * Composición funcional izquierda→derecha para funciones unarias.
 * pipe(a, f, g, h) => h(g(f(a)))
 */
export function pipe<A, B>(a: A, ...fns: Array<(x: A | B) => A | B>): A | B {
    // Tipado genérico simple; en uso real se castea a tipos intermedios concretos
    return fns.reduce((acc: A | B, fn: (x: A | B) => A | B) => fn(acc), a);
}
