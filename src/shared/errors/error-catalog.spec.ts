import { ErrorCode, errorCodeForStatus } from './error-catalog';

describe('errorCodeForStatus', () => {
  it.each([
    [400, ErrorCode.ValidationError],
    [404, ErrorCode.NotFound],
    [501, ErrorCode.NotImplemented],
    [503, ErrorCode.DependencyUnavailable],
    [500, ErrorCode.InternalError],
    [502, ErrorCode.InternalError],
    [409, ErrorCode.RequestError],
  ])('status %i produce %s', (status, code) => {
    expect(errorCodeForStatus(status)).toBe(code);
  });
});
