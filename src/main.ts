import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableShutdownHooks();

  if (config.get<boolean>('SWAGGER_ENABLED')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('FleetOps · Incident Service')
        .setDescription('Microservicio de Incidentes (Grupo 5)')
        .setVersion('0.1.0')
        .build(),
    );
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs-json',
    });
  }

  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
