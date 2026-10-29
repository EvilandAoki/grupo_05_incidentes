export enum ErrorCode {
  ValidationError = 'validation_error',
  // 404 genérico (ruta inexistente); los recursos de negocio usan sus códigos propios.
  NotFound = 'not_found',
  IncidentNotFound = 'incident_not_found',
  AssignmentNotFound = 'assignment_not_found',
  VehicleNotFound = 'vehicle_not_found',
  AssignmentNotInProgress = 'assignment_not_in_progress',
  ReportedAtInFuture = 'reported_at_in_future',
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
