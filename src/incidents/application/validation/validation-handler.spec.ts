import { ValidationHandler } from './validation-handler';

class RecordingHandler extends ValidationHandler<string[]> {
  constructor(
    private readonly name: string,
    private readonly fail = false,
  ) {
    super();
  }

  protected validate(context: string[]): Promise<void> {
    context.push(this.name);
    return this.fail ? Promise.reject(new Error(this.name)) : Promise.resolve();
  }
}

describe('ValidationHandler', () => {
  it('ejecuta los validadores en el orden encadenado', async () => {
    const first = new RecordingHandler('first');
    first
      .setNext(new RecordingHandler('second'))
      .setNext(new RecordingHandler('third'));
    const visited: string[] = [];

    await first.handle(visited);

    expect(visited).toEqual(['first', 'second', 'third']);
  });

  it('funciona sin siguiente validador', async () => {
    const visited: string[] = [];

    await new RecordingHandler('only').handle(visited);

    expect(visited).toEqual(['only']);
  });

  it('corta la cadena cuando un validador falla', async () => {
    const first = new RecordingHandler('first', true);
    first.setNext(new RecordingHandler('second'));
    const visited: string[] = [];

    await expect(first.handle(visited)).rejects.toThrow('first');
    expect(visited).toEqual(['first']);
  });
});
