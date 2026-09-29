import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({});
  }

  async onModuleInit() {
    await this.withTransientRetry(() => this.$connect());
  }

  async withTransientRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (!this.isTransientConnectionError(error) || attempt === maxAttempts) {
          throw error;
        }
        await this.wait(120 * attempt);
      }
    }

    throw lastError;
  }

  private isTransientConnectionError(error: unknown) {
    const code = (error as { code?: string })?.code;
    const message = String((error as { message?: string })?.message ?? '');
    return (
      code === 'P1001' ||
      code === 'P1017' ||
      message.includes("Can't reach database server") ||
      message.includes('Server has closed the connection')
    );
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
