/**
 * DomainEvent interface contract.
 * Represents an event of significance that occurred inside the domain boundary.
 */
export interface DomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): string;
}
