import assert from 'node:assert/strict';
import {
  loadRememberedEmail,
  REMEMBERED_EMAIL_KEY,
  saveRememberedEmail
} from './login-remember.util.ts';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const storage = new MemoryStorage();

saveRememberedEmail(storage, '  teacher1@sfxsai.com  ', true);
assert.equal(storage.getItem(REMEMBERED_EMAIL_KEY), 'teacher1@sfxsai.com');
assert.equal(loadRememberedEmail(storage), 'teacher1@sfxsai.com');

saveRememberedEmail(storage, 'teacher1@sfxsai.com', false);
assert.equal(storage.getItem(REMEMBERED_EMAIL_KEY), null);
assert.equal(loadRememberedEmail(storage), '');

console.log('login remember utility tests passed');
