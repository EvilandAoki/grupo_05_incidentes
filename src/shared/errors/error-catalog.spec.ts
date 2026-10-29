import { ErrorCode, errorCodeForStatus } from './error-catalog';

describe('errorCodeForStatus', () => {
  it.each([
    [400, ErrorCode.ValidationError],
    [404, ErrorCode.NotFound],
    [502, ErrorCode.InternalError], // 5xx fuera del mapa
    [409, ErrorCode.RequestError], // 4xx fuera del mapa
  ])('status %i produce %s', (status, code) => {
    expect(errorCodeForStatus(status)).toBe(code);
  });
});
