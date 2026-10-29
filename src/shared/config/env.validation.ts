import * as Joi from 'joi';

const httpUrl = Joi.string().uri({ scheme: ['http', 'https'] });

// Obligatoria solo en producción para que desarrollo y pruebas arranquen con DATABASE_URL.
const REQUIRED_IN_PRODUCTION = { is: 'production', then: Joi.required() };

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  TZ: Joi.string().default('America/Bogota'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),

  ASSIGNMENTS_BASE_URL: httpUrl.when('NODE_ENV', REQUIRED_IN_PRODUCTION),
  VEHICLES_BASE_URL: httpUrl.when('NODE_ENV', REQUIRED_IN_PRODUCTION),
  HTTP_TIMEOUT_MS: Joi.number().integer().min(100).default(3000),
  CIRCUIT_BREAKER_ERROR_THRESHOLD: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50),
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .default(10000),

  AWS_REGION: Joi.string().default('us-east-1'),
  SNS_TOPIC_ARN: Joi.string()
    .pattern(/^arn:aws:sns:[a-z0-9-]+:\d{12}:fleetops_incident_events$/)
    .when('NODE_ENV', REQUIRED_IN_PRODUCTION),
  // Solo local (LocalStack); vacío en EC2.
  AWS_ENDPOINT_URL: Joi.string().uri().allow(''),
  OUTBOX_POLL_INTERVAL_MS: Joi.number().integer().min(1000).default(5000),
});
