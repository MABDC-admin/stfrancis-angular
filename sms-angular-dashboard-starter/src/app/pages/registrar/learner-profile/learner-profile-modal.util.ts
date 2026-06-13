export function shouldCloseModalOnKey(key: string, isModalOpen: boolean): boolean {
  return isModalOpen && key === 'Escape';
}
