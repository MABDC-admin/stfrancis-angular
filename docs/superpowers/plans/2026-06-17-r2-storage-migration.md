# R2 Storage Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move backend-managed uploaded files from VPS-local storage to Cloudflare R2 without changing the current upload endpoints.

**Architecture:** Keep Multer temp uploads and the `StoredFile` metadata table, but add a provider abstraction inside the NestJS storage module. New uploads use either the local filesystem or R2 based on environment configuration, and file reads go through a backend content endpoint that can stream from either provider.

**Tech Stack:** NestJS, Prisma, Multer, Cloudflare R2 S3-compatible API, `@aws-sdk/client-s3`, Jest

---

### Task 1: Add config helpers and URL behavior tests

**Files:**
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.util.ts`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.util.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import {
  buildStoredFileName,
  getStorageProvider,
  toStoredFileContentUrl,
} from './storage.util';

describe('storage util', () => {
  afterEach(() => {
    delete process.env.STORAGE_PROVIDER;
  });

  it('defaults to local storage provider', () => {
    expect(getStorageProvider()).toBe('local');
  });

  it('recognizes the r2 storage provider', () => {
    process.env.STORAGE_PROVIDER = 'r2';
    expect(getStorageProvider()).toBe('r2');
  });

  it('builds a file content url by stored file id', () => {
    expect(toStoredFileContentUrl('http://127.0.0.1:3000/', 'file-123')).toBe(
      'http://127.0.0.1:3000/storage/files/file-123/content',
    );
  });

  it('preserves the file extension in generated names', () => {
    expect(buildStoredFileName('Avatar Photo.JPG', 'abc')).toBe('abc-avatar-photo.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage/storage.util.spec.ts --runInBand`
Expected: FAIL because `getStorageProvider` and `toStoredFileContentUrl` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export type StorageProvider = 'local' | 'r2';

export function getStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER?.toLowerCase() === 'r2' ? 'r2' : 'local';
}

export function toStoredFileContentUrl(apiOrigin: string, fileId: string): string {
  const origin = apiOrigin.replace(/\/+$/, '');
  return `${origin}/storage/files/${fileId}/content`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage/storage.util.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/storage.util.ts src/storage/storage.util.spec.ts
git commit -m "test: cover storage provider helpers"
```

### Task 2: Add failing service tests for R2 upload and delete

**Files:**
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.service.spec.ts`
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.service.ts`

- [ ] **Step 1: Write the failing tests**

```ts
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  rename: jest.fn(),
  rm: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => {
  class PutObjectCommand { constructor(public input: any) {} }
  class DeleteObjectCommand { constructor(public input: any) {} }
  class GetObjectCommand { constructor(public input: any) {} }
  return { S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })), PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
});

it('uploads a temp file to R2 and stores proxy public url metadata', async () => {
  process.env.STORAGE_PROVIDER = 'r2';
  process.env.R2_BUCKET = 'sfxsai-storage';
  process.env.R2_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
  process.env.R2_ACCESS_KEY_ID = 'key';
  process.env.R2_SECRET_ACCESS_KEY = 'secret';
  // construct service with mocked prisma, mock readFile and S3 send
  // expect prisma.storedFile.create to receive publicUrl ending with /storage/files/<id>/content
  // expect rm(tempPath) to be called
});

it('deletes the object from R2 when deleting metadata', async () => {
  process.env.STORAGE_PROVIDER = 'r2';
  // mock prisma.storedFile.findUnique to return a file
  // expect S3 delete command to be sent
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage/storage.service.spec.ts --runInBand`
Expected: FAIL because `StorageService` does not yet support R2 uploads/deletes.

- [ ] **Step 3: Write minimal implementation**

Implement:

- lazy S3 client creation
- R2 config validation
- upload path using `PutObjectCommand`
- delete path using `DeleteObjectCommand`
- `publicUrl` generation through `/storage/files/:id/content`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage/storage.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/storage.service.ts src/storage/storage.service.spec.ts
git commit -m "feat: add R2-backed storage service"
```

### Task 3: Add failing controller tests for file content delivery

**Files:**
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.controller.spec.ts`
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.controller.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('requests file content by stored file id', async () => {
  const streamFile = jest.fn();
  const service = { streamFileById: streamFile };
  const controller = new StorageController(service as any);
  const res = { setHeader: jest.fn() };
  await controller.getFileContent('file-1', res as any);
  expect(streamFile).toHaveBeenCalledWith('file-1', res);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage/storage.controller.spec.ts --runInBand`
Expected: FAIL because the controller endpoint and service method do not exist.

- [ ] **Step 3: Write minimal implementation**

Add:

- `GET /storage/files/:id/content`
- controller pass-through to `storageService.streamFileById(id, res)`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage/storage.controller.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/storage.controller.ts src/storage/storage.controller.spec.ts
git commit -m "feat: add storage content endpoint"
```

### Task 4: Implement provider-backed streaming behavior

**Files:**
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.service.ts`
- Test: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('streams file content from R2 by stored file id', async () => {
  process.env.STORAGE_PROVIDER = 'r2';
  // mock prisma lookup and S3 getObject body stream
  // assert response headers and body piping behavior
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage/storage.service.spec.ts --runInBand`
Expected: FAIL because streaming behavior is not implemented yet.

- [ ] **Step 3: Write minimal implementation**

Implement `streamFileById(id, res)` that:

- looks up the `StoredFile` row
- for `local`, streams the filesystem file
- for `r2`, issues `GetObjectCommand` and streams the returned body
- sets `Content-Type` and `Content-Length` headers where available

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage/storage.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/storage.service.ts src/storage/storage.service.spec.ts
git commit -m "feat: stream stored files from active provider"
```

### Task 5: Wire deployment env and R2 bucket provisioning support

**Files:**
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\.env.vps.example`
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\docker-compose.vps.yml`
- Create: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\scripts\setup-r2-bucket.mjs`
- Modify: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\docs\VPS_POSTGRES_NEON_REPLICATION.md`

- [ ] **Step 1: Write the failing verification target**

Define verification:

- Node script can list or create the configured R2 bucket using the provided endpoint and credentials.
- Compose passes the R2 env vars into the API container.

- [ ] **Step 2: Run verification to confirm the gap exists**

Run: `node scripts/setup-r2-bucket.mjs --check`
Expected: FAIL because the script and env wiring do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add:

- `STORAGE_PROVIDER`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_REGION`
- reusable Node provisioning script using `@aws-sdk/client-s3`

- [ ] **Step 4: Run verification to confirm it passes**

Run: `node scripts/setup-r2-bucket.mjs --check`
Expected: PASS or explicit bucket-created confirmation

- [ ] **Step 5: Commit**

```bash
git add .env.vps.example docker-compose.vps.yml scripts/setup-r2-bucket.mjs docs/VPS_POSTGRES_NEON_REPLICATION.md
git commit -m "chore: wire R2 deployment configuration"
```

### Task 6: Final verification

**Files:**
- Test: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.util.spec.ts`
- Test: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.service.spec.ts`
- Test: `C:\Users\DENNIS\Desktop\sms-angular-registrar-module-starter\sms-nestjs-backend\src\storage\storage.controller.spec.ts`

- [ ] **Step 1: Run focused storage tests**

Run: `npm test -- storage/storage.util.spec.ts storage/storage.service.spec.ts storage/storage.controller.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 2: Run backend build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Verify R2 bucket state**

Run: `node scripts/setup-r2-bucket.mjs --check`
Expected: PASS with the target bucket present

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: migrate backend-managed files to R2"
```
