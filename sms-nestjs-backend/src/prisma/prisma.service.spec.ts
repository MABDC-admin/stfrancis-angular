import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retries transient Neon reachability errors before succeeding', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce({ code: 'P1001' })
      .mockResolvedValueOnce('ok');

    await expect(service.withTransientRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient database errors', async () => {
    const error = { code: 'P2002' };
    const operation = jest.fn().mockRejectedValue(error);

    await expect(service.withTransientRetry(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
