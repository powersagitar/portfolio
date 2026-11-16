/** Main:263. Fills an n-point Float32Array, calling fn(i) in index order. */
export function make(
  n: number,
  fn: (i: number) => [number, number, number],
): Float32Array {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = fn(i);
    a[i * 3] = p[0];
    a[i * 3 + 1] = p[1];
    a[i * 3 + 2] = p[2];
  }
  return a;
}
