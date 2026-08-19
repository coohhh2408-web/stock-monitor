/** Vite 开发服上的 /em-* 代理，跟页面是不是 5173 端口无关（隧道/局域网同样有效）。 */
export function usesDevProxy(): boolean {
  return import.meta.env.DEV
}
