# ADR-003: Selection of PostgreSQL Database

## Status
Accepted

## Context
JobNest is a hyperlocal platform. The database must handle coordinates, compute distance radiuses, and run location queries (e.g. "find all jobs within 5km"). It also requires transaction ledgers for wallets.

We evaluated NoSQL databases (e.g., MongoDB) vs Relational databases.

## Decision
We chose **PostgreSQL** as the primary relational database.

## Consequences
*   **Geospatial Queries**: PostgreSQL supports the **PostGIS** extension, providing optimized indices (`GIST`) for fast distance calculations.
*   **Data Integrity**: Enforces strict ACID compliance, ensuring wallet transactions and payouts are robust against concurrency errors.
