import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indicators: HealthIndicatorService,
  ) {}

  async isHealthy<const Key extends string>(key: Key) {
    const session = this.indicators.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return session.up();
    } catch {
      return session.down('La BD no responde');
    }
  }
}
