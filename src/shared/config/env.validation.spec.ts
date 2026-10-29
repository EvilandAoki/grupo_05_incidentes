import { envValidationSchema } from './env.validation';

const DATABASE_URL = 'postgresql://u:p@localhost:5432/db?schema=public';

describe('envValidationSchema', () => {
  it('aplica valores por defecto', () => {
    const { error, value } = envValidationSchema.validate({
      DATABASE_URL,
    });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      TZ: 'America/Bogota',
      SWAGGER_ENABLED: true,
      LOG_LEVEL: 'info',
      HTTP_TIMEOUT_MS: 3000,
      CIRCUIT_BREAKER_ERROR_THRESHOLD: 50,
      CIRCUIT_BREAKER_RESET_TIMEOUT_MS: 10000,
      AWS_REGION: 'us-east-1',
      OUTBOX_POLL_INTERVAL_MS: 5000,
    });
  });

  it('convierte PORT y SWAGGER_ENABLED desde texto', () => {
    const { value } = envValidationSchema.validate({
      DATABASE_URL,
      PORT: '4000',
      SWAGGER_ENABLED: 'false',
    });

    expect(value).toMatchObject({ PORT: 4000, SWAGGER_ENABLED: false });
  });

  it('exige DATABASE_URL', () => {
    const { error } = envValidationSchema.validate({});

    expect(error?.message).toContain('"DATABASE_URL" is required');
  });

  it('rechaza una DATABASE_URL que no es PostgreSQL', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL: 'mysql://u:p@localhost/db',
    });

    expect(error).toBeDefined();
  });

  it('rechaza un NODE_ENV desconocido', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL,
      NODE_ENV: 'staging',
    });

    expect(error).toBeDefined();
  });

  it('rechaza un SNS_TOPIC_ARN que no es el topic fleetops_incident_events', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL,
      SNS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:incident-events',
    });

    expect(error).toBeDefined();
  });

  it('exige URLs de dependencias y SNS_TOPIC_ARN solo en producción', () => {
    const { error } = envValidationSchema.validate(
      { DATABASE_URL, NODE_ENV: 'production' },
      { abortEarly: false },
    );

    expect(error?.details.map((d) => d.path[0])).toEqual([
      'ASSIGNMENTS_BASE_URL',
      'VEHICLES_BASE_URL',
      'SNS_TOPIC_ARN',
    ]);
  });

  it('acepta AWS_ENDPOINT_URL vacío y una configuración completa de producción', () => {
    const { error } = envValidationSchema.validate({
      DATABASE_URL,
      NODE_ENV: 'production',
      ASSIGNMENTS_BASE_URL: 'http://assignments:3001',
      VEHICLES_BASE_URL: 'http://vehicles:3002',
      SNS_TOPIC_ARN:
        'arn:aws:sns:us-east-1:123456789012:fleetops_incident_events',
      AWS_ENDPOINT_URL: '',
    });

    expect(error).toBeUndefined();
  });
});
