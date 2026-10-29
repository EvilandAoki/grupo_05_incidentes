// Cadena de responsabilidad: cada validador revisa una regla y delega al siguiente.
export abstract class ValidationHandler<TContext> {
  private next?: ValidationHandler<TContext>;

  setNext(next: ValidationHandler<TContext>): ValidationHandler<TContext> {
    this.next = next;
    return next;
  }

  async handle(context: TContext): Promise<void> {
    await this.validate(context);
    if (this.next) {
      await this.next.handle(context);
    }
  }

  protected abstract validate(context: TContext): Promise<void>;
}
