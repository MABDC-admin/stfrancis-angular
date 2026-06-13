import {
  buildStoredFileName,
  isAllowedStorageMimeType,
  normalizeStorageToken,
  toPublicStorageUrl,
} from './storage.util';

describe('storage utilities', () => {
  it('normalizes unsafe owner/category tokens for path buckets', () => {
    expect(normalizeStorageToken('Learner Documents / 2026')).toBe(
      'learner-documents-2026',
    );
    expect(normalizeStorageToken('../Staff Photo')).toBe('staff-photo');
  });

  it('builds collision-resistant stored file names while preserving extensions', () => {
    const storedName = buildStoredFileName(
      'Juan Dela Cruz Report Card.PDF',
      'fixed-id',
    );

    expect(storedName).toBe('fixed-id-juan-dela-cruz-report-card.pdf');
  });

  it('allows school document and avatar file types only', () => {
    expect(isAllowedStorageMimeType('application/pdf')).toBe(true);
    expect(isAllowedStorageMimeType('image/png')).toBe(true);
    expect(isAllowedStorageMimeType('image/jpeg')).toBe(true);
    expect(isAllowedStorageMimeType('text/html')).toBe(false);
  });

  it('creates public URLs using the API origin and relative storage path', () => {
    expect(
      toPublicStorageUrl(
        'http://localhost:3000/',
        'learner-document/student-1/file.pdf',
      ),
    ).toBe(
      'http://localhost:3000/storage/learner-document/student-1/file.pdf',
    );
  });
});
