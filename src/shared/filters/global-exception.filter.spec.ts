import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  HttpException,
  Logger,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/incidents?page=0' }),
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('501 responde not_implemented con el formato estándar', () => {
    filter.catch(new NotImplementedException('pendiente'), host);

    expect(status).toHaveBeenCalledWith(501);
    expect(json).toHaveBeenCalledWith({
      code: 'not_implemented',
      message: 'pendiente',
      timestamp: expect.stringMatching(/-05:00$/),
      path: '/incidents?page=0',
    });
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });

  it('400 de ValidationPipe incluye errors[]', () => {
    filter.catch(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'severity must be one of the following values: minor, severe',
        ],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'validation_error',
        message: 'Validation failed',
        errors: ['severity must be one of the following values: minor, severe'],
      }),
    );
  });

  it('404 responde not_found', () => {
    filter.catch(new NotFoundException('no existe'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'not_found', message: 'no existe' }),
    );
  });

  it('usa el code propio de la excepción cuando lo trae', () => {
    filter.catch(
      new ConflictException({
        code: 'assignment_not_in_progress',
        message: 'La asignación no está en curso',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'assignment_not_in_progress',
        message: 'La asignación no está en curso',
      }),
    );
  });

  it('acepta excepciones cuyo cuerpo es un texto', () => {
    filter.catch(new HttpException('texto plano', 418), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'request_error',
        message: 'texto plano',
      }),
    );
  });

  it('503 de Terminus conserva el mensaje de la excepción', () => {
    filter.catch(
      new ServiceUnavailableException({ status: 'error', details: {} }),
      host,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'dependency_unavailable',
        message: 'Service Unavailable Exception',
      }),
    );
  });

  it('error inesperado responde 500 sin filtrar detalles y lo registra', () => {
    filter.catch(new Error('secreto interno'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'internal_error',
        message: 'Internal server error',
      }),
    );
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('registra también valores lanzados que no son Error', () => {
    filter.catch('boom', host);

    expect(Logger.prototype.error).toHaveBeenCalledWith('boom');
  });
});
