import { ClsServiceManager } from 'nestjs-cls';
import { getCorrelationId, resolveCorrelationId } from './correlation-context';

const UUID = /^[0-9a-f-]{36}$/;

describe('resolveCorrelationId', () => {
  it('propaga la cabecera recibida', () => {
    expect(
      resolveCorrelationId({ headers: { 'x-correlation-id': 'abc-123' } }),
    ).toBe('abc-123');
  });

  it.each([
    [{}],
    [{ 'x-correlation-id': '  ' }],
    [{ 'x-correlation-id': ['a', 'b'] }],
  ])(
    'genera un UUID cuando la cabecera falta, está vacía o repetida (%j)',
    (headers) => {
      expect(resolveCorrelationId({ headers })).toMatch(UUID);
    },
  );
});

describe('getCorrelationId', () => {
  it('lee el id guardado en el contexto de la petición', () => {
    const get = jest.fn().mockReturnValue('abc-123');
    jest
      .spyOn(ClsServiceManager, 'getClsService')
      .mockReturnValue({ get } as never);

    expect(getCorrelationId()).toBe('abc-123');
    expect(get).toHaveBeenCalledWith('correlationId');
  });
});
