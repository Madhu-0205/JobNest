/**
 * Base Entity class.
 * Entities represent domain concepts that have a unique identity and lifecycle.
 */
export abstract class Entity<Props> {
  protected readonly _id: string;
  public readonly props: Props;

  constructor(props: Props, id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  /**
   * Compares two entities for identity equality.
   */
  equals(object?: Entity<Props>): boolean {
    if (object == null) return false;
    if (this === object) return true;
    return this._id === object._id;
  }
}

/**
 * Base ValueObject class.
 * ValueObjects represent descriptive domain concepts that have no identity.
 * Equality is determined solely by property structural equivalence.
 */
export abstract class ValueObject<Props> {
  public readonly props: Props;

  constructor(props: Props) {
    this.props = Object.freeze(props);
  }

  /**
   * Compares two ValueObjects for structural equality.
   */
  equals(vo?: ValueObject<Props>): boolean {
    if (vo == null || vo.props === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
