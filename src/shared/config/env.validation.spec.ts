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
});
