import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Histogram } from '@prometheus-io/client';
import { EventEmitter } from 'node:events';
import { lastValueFrom, of, throwError } from 'rxjs';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

describe('HttpMetricsInterceptor', () => {
  let stop: jest.Mock;
  let interceptor: HttpMetricsInterceptor;

  beforeEach(() => {
    stop = jest.fn();
    interceptor = new HttpMetricsInterceptor({
      startTimer: jest.fn().mockReturnValue(stop),
    } as unknown as Histogram<'method' | 'route' | 'status_code'>);
  });

  function contextFor(route: string, method = 'GET') {
    const response = Object.assign(new EventEmitter(), { statusCode: 200 });
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method, path: route, route: { path: route } }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    return { context, response };
  }

  it('observa la duración con method, route del controlador y status final', async () => {
    const { context, response } = contextFor('/incidents/:id');

    await lastValueFrom(
      interceptor.intercept(context, { handle: () => of('ok') } as CallHandler),
    );
    response.emit('finish');

    expect(stop).toHaveBeenCalledWith({
      method: 'GET',
      route: '/incidents/:id',
      status_code: 200,
    });
  });

  it('también observa cuando la petición termina en error', async () => {
    const { context, response } = contextFor('/incidents', 'POST');

    await expect(
      lastValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => new Error('501')),
        } as CallHandler),
      ),
    ).rejects.toThrow('501');
    response.statusCode = 501; // lo fija el filtro global antes de 'finish'
    response.emit('finish');

    expect(stop).toHaveBeenCalledWith({
      method: 'POST',
      route: '/incidents',
      status_code: 501,
    });
  });

  it.each(['/metrics', '/health'])('no mide %s', async (route) => {
    const { context, response } = contextFor(route);

    await lastValueFrom(
      interceptor.intercept(context, { handle: () => of('ok') } as CallHandler),
    );
    response.emit('finish');

    expect(stop).not.toHaveBeenCalled();
  });
});
