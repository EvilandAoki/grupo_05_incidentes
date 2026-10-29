import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

process.env.DATABASE_URL = 'postgresql://e2e:e2e@localhost:5432/e2e';
process.env.LOG_LEVEL = 'silent';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

const ASSIGNMENT_ID = '3f2b8c1e-5a7d-4e0b-9c64-1d2e3f4a5b6c';

describe('Incident API (e2e, sin BD real)', () => {
  let app: INestApplication<App>;
  const prisma = {
    $queryRaw: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('e2e').build(),
      ),
      { jsonDocumentUrl: 'docs-json' },
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /incidents válido responde 501 (descarta campos no declarados, no 400) con X-Correlation-Id', async () => {
    const res = await request(app.getHttpServer())
      .post('/incidents')
      .set('X-Correlation-Id', 'corr-e2e')
      .send({
        vehicle_id: 'se-descarta',
        assignment_id: ASSIGNMENT_ID,
        severity: 'minor',
        description: 'Llanta pinchada',
        reported_at: '2026-10-28T09:30:00-05:00',
      })
      .expect(501);

    expect(res.headers['x-correlation-id']).toBe('corr-e2e');
    expect(res.body).toEqual({
      code: 'not_implemented',
      message: expect.any(String),
      timestamp: expect.stringMatching(/-05:00$/),
      path: '/incidents',
    });
  });

  it('POST /incidents inválido responde 400 con errors[] {field, code}', async () => {
    const res = await request(app.getHttpServer())
      .post('/incidents')
      .send({
        assignment_id: ASSIGNMENT_ID,
        severity: 'urgent',
        reported_at: '2026-10-28T09:30:00-05:00',
      })
      .expect(400);

    expect(res.body).toMatchObject({
      code: 'validation_error',
      message: 'La solicitud tiene campos inválidos.',
      path: '/incidents',
    });
    expect(res.body.errors).toEqual([
      { field: 'severity', code: 'invalid_value' },
      { field: 'description', code: 'required' },
    ]);
    expect(res.headers['x-correlation-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('GET /incidents/{id} con id no UUID responde 400 con field id', async () => {
    const res = await request(app.getHttpServer())
      .get('/incidents/abc')
      .expect(400);

    expect(res.body.errors).toEqual([{ field: 'id', code: 'invalid_format' }]);
  });

  it('GET /incidents/{id} responde 501', async () => {
    await request(app.getHttpServer())
      .get(`/incidents/${ASSIGNMENT_ID}`)
      .expect(501);
  });

  it('GET /incidents responde 501 y valida los query params', async () => {
    await request(app.getHttpServer()).get('/incidents').expect(501);
    await request(app.getHttpServer()).get('/incidents?size=0').expect(400);
  });

  it('GET /health responde 200 con la BD arriba y 503 si cae', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const ok = await request(app.getHttpServer()).get('/health').expect(200);
    expect(ok.body.status).toBe('ok');
    expect(ok.body.info.database.status).toBe('up');

    prisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));
    const down = await request(app.getHttpServer()).get('/health').expect(503);
    expect(down.body.code).toBe('dependency_unavailable');
  });

  it('GET /metrics responde formato Prometheus', async () => {
    const res = await request(app.getHttpServer()).get('/metrics').expect(200);

    expect(res.text).toContain('# HELP');
    expect(res.text).toContain(
      'http_request_duration_seconds_count{method="POST",route="/incidents",status_code="501"}',
    );
    expect(res.text).not.toMatch(/route="\/(metrics|health)"/);
  });

  it('Swagger documenta los 5 endpoints', async () => {
    const res = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(Object.keys(res.body.paths).sort()).toEqual([
      '/health',
      '/incidents',
      '/incidents/{id}',
      '/metrics',
    ]);
    expect(Object.keys(res.body.paths['/incidents'])).toEqual(['post', 'get']);
  });
});
