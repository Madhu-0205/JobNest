/**
 * Monadic Result Pattern for Type-Safe Error Handling.
 * Enforces explicitly handling operation success or failure without throwing untyped exceptions.
 */
export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
  }

  /**
   * Creates a successful Result instance containing a value.
   */
  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Creates a failed Result instance containing an error.
   */
  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Retrieves the successful value. Throws the associated error if the Result failed.
   */
  unwrap(): T {
    if (this.isFailure) {
      if (this._error instanceof Error) {
        throw this._error;
      }
      throw new Error(`Failed to unwrap result: ${String(this._error)}`);
    }
    return this._value as T;
  }

  /**
   * Retrieves the error payload. Throws if the Result succeeded.
   */
  error(): E {
    if (this.isSuccess) {
      throw new Error("Cannot retrieve error of a successful Result.");
    }
    return this._error as E;
  }

  /**
   * Safely maps a successful value to a new type.
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return Result.ok<U, E>(fn(this._value as T));
  }
}
