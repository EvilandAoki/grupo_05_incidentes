import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      // La app arranca igual: /health informa 503 mientras la BD no responda.
      this.logger.error(`No se pudo conectar a la BD: ${String(error)}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
