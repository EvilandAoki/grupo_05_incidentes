import { BadRequestException, ValidationError } from '@nestjs/common';
import { ErrorCode } from '../errors/error-catalog';

export type FieldErrorCode =
  'required' | 'too_long' | 'invalid_value' | 'invalid_format';

export interface FieldError {
  field: string;
  code: FieldErrorCode;
}

export const VALIDATION_ERROR_MESSAGE = 'La solicitud tiene campos inválidos.';

// Orden de prioridad: el primer grupo con una restricción incumplida decide el código.
const CODE_BY_CONSTRAINT: Array<[FieldErrorCode, string[]]> = [
  ['required', ['isDefined', 'isNotEmpty']],
  ['too_long', ['maxLength']],
  ['invalid_value', ['isEnum', 'min', 'max']],
];

function codeFor(error: ValidationError): FieldErrorCode {
  if (error.value === undefined || error.value === null) {
    return 'required';
  }
  const failed = Object.keys(error.constraints ?? {});
  const match = CODE_BY_CONSTRAINT.find(([, constraints]) =>
    constraints.some((constraint) => failed.includes(constraint)),
  );
  return match ? match[0] : 'invalid_format';
}

export function buildValidationException(
  errors: FieldError[],
): BadRequestException {
  return new BadRequestException({
    code: ErrorCode.ValidationError,
    message: VALIDATION_ERROR_MESSAGE,
    errors,
  });
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return buildValidationException(
    errors.map((error) => ({ field: error.property, code: codeFor(error) })),
  );
}
