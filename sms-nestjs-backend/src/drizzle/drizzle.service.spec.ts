jest.mock('pg', () => {
  const end = jest.fn();
  const release = jest.fn();
  const connect = jest.fn().mockResolvedValue({ release });
  const Pool = jest.fn().mockImplementation((config) => ({
    config,
    connect,
    end,
  }));

  return { Pool, __mock: { end, connect, release } };
});

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(() => ({ mocked: true })),
}));

import { DrizzleService } from './drizzle.service';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

describe('DrizzleService', () => {
  const originalEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://postgres:secret@127.0.0.1:5432/sfxsai';
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalEnv;
  });

  it('initializes Drizzle with a standard PostgreSQL pool', async () => {
    const service = new DrizzleService();

    await service.onModuleInit();

    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgresql://postgres:secret@127.0.0.1:5432/sfxsai',
      }),
    );
    expect(drizzle).toHaveBeenCalled();
    expect(service.db).toEqual({ mocked: true });
  });

  it('closes the postgres pool on module destroy', async () => {
    const service = new DrizzleService();

    await service.onModuleInit();
    await service.onModuleDestroy();

    const poolInstance = (Pool as unknown as jest.Mock).mock.results[0]?.value as { end: jest.Mock };
    expect(poolInstance.end).toHaveBeenCalledTimes(1);
  });
});
