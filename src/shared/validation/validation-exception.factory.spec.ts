import { ValidationError } from '@nestjs/common';
import {
  buildValidationException,
  validationExceptionFactory,
} from './validation-exception.factory';

function failure(
  property: string,
  value: unknown,
  ...constraints: string[]
): ValidationError {
  return {
    property,
    value,
    constraints: Object.fromEntries(constraints.map((c) => [c, c])),
  };
}

describe('validationExceptionFactory', () => {
  it.each([
    [
      'required por valor ausente',
      failure('description', undefined, 'isString'),
      'required',
    ],
    [
      'required por cadena vacía',
      failure('description', '', 'isNotEmpty'),
      'required',
    ],
    ['too_long', failure('description', 'x', 'maxLength'), 'too_long'],
    [
      'invalid_value por enum',
      failure('severity', 'urgent', 'isEnum'),
      'invalid_value',
    ],
    ['invalid_value por rango', failure('size', 0, 'min'), 'invalid_value'],
    [
      'invalid_format',
      failure('assignment_id', '1', 'isUuid'),
      'invalid_format',
    ],
    [
      'prioridad: too_long antes que invalid_format',
      failure('description', 'x', 'isString', 'maxLength'),
      'too_long',
    ],
  ])('%s', (_name, error, code) => {
    const exception = validationExceptionFactory([error]);

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      code: 'validation_error',
      message: 'La solicitud tiene campos inválidos.',
      errors: [{ field: error.property, code }],
    });
  });

  it('devuelve un elemento por campo y tolera errores sin restricciones', () => {
    const exception = validationExceptionFactory([
      failure('severity', 'urgent', 'isEnum'),
      { property: 'meta', value: 1 },
    ]);

    expect(exception.getResponse()).toMatchObject({
      errors: [
        { field: 'severity', code: 'invalid_value' },
        { field: 'meta', code: 'invalid_format' },
      ],
    });
  });
});

describe('buildValidationException', () => {
  it('arma el mismo cuerpo para errores fuera del ValidationPipe', () => {
    expect(
      buildValidationException([
        { field: 'id', code: 'invalid_format' },
      ]).getResponse(),
    ).toMatchObject({
      code: 'validation_error',
      errors: [{ field: 'id', code: 'invalid_format' }],
    });
  });
});
