import { Entity } from "./base";
import { DomainEvent } from "./events";

/**
 * Base AggregateRoot class.
 * Aggregate roots are entities that define transactional boundaries in clean architecture
 * and can emit domain events.
 */
export abstract class AggregateRoot<Props> extends Entity<Props> {
  private _domainEvents: DomainEvent[] = [];

  /**
   * Retrieves all emitted domain events.
   */
  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  /**
   * Adds a new domain event to the collection.
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Clears the collection of domain events after successful dispatching.
   */
  clearEvents(): void {
    this._domainEvents = [];
  }
}
