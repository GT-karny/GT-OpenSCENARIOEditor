export function isElectron(): boolean {
  return !!window.electronAPI?.isElectron;
}
