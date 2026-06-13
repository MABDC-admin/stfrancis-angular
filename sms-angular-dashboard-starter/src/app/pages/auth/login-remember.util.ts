export const REMEMBERED_EMAIL_KEY = 'sfxsai.rememberedEmail';

export function loadRememberedEmail(storage: Storage): string {
  return storage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}

export function saveRememberedEmail(storage: Storage, email: string, remember: boolean): void {
  if (!remember) {
    storage.removeItem(REMEMBERED_EMAIL_KEY);
    return;
  }

  storage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
}
