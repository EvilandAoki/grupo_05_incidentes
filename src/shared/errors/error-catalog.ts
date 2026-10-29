export enum ErrorCode {
  ValidationError = 'validation_error',
  NotFound = 'not_found',
  AssignmentNotInProgress = 'assignment_not_in_progress',
  DependencyUnavailable = 'dependency_unavailable',
  NotImplemented = 'not_implemented',
  RequestError = 'request_error',
  InternalError = 'internal_error',
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: ErrorCode.ValidationError,
  404: ErrorCode.NotFound,
  501: ErrorCode.NotImplemented,
  503: ErrorCode.DependencyUnavailable,
};

export function errorCodeForStatus(status: number): ErrorCode {
  const code = CODE_BY_STATUS[status];
  if (code) {
    return code;
  }
  return status >= 500 ? ErrorCode.InternalError : ErrorCode.RequestError;
}
