import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('returns JWT_SECRET from the environment', () => {
    process.env.JWT_SECRET = 'production-grade-secret';

    expect(getJwtSecret()).toBe('production-grade-secret');
  });

  it('fails closed when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow('JWT_SECRET is required');
  });
});
