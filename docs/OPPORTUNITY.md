# JobNest V2 Hyperlocal Opportunity Engine Guide

This document describes the design and database architecture of the JobNest V2 Opportunity Engine.

---

## 1. Core Opportunity Domain

Unlike standard job portals, JobNest centers around a unified **Opportunity** domain concept. An opportunity can represent a full-time job, a village chore, farm labor, seasonal hospitality work, or student freelance projects.

The database structure separates categories and types to keep listings modular and non-hardcoded:

*   `opportunity_categories`: E.g., Trades, Logistics, Hospitality, Chores, Agriculture.
*   `opportunity_types`: E.g., Permanent, Part Time, Hourly, Daily Wage, Temporary.

---

## 2. Address & Pricing Systems

### Address Structure
Every opportunity holds an address structure for hyperlocal radius calculations:
*   `house_number`, `street`, `landmark` (Point of Interest reference)
*   `village`, `town`, `city`, `mandal_taluk` (Administrative divisions)
*   `district`, `state`, `country`, `pincode`
*   `location`: PostGIS geography `Point` field for high-speed radius sorting.

### Pricing Models
The pricing model structure supports:
*   Standard rates (Hourly, Daily, Weekly, Monthly, Fixed)
*   Bidding options (Negotiable, ranges)
*   Preparation columns for future dynamic pricing and auction tables.

---

## 3. Hiring State Machine Workflow

Every application traces a strict state machine flow, logged in `application_status_history`:

```
 [applied] ──► [shortlisted] ──► [offered] ──► [accepted] ──► [completed]
     │               │              │             │               │
     ▼               ▼              ▼             ▼               ▼
[withdrawn]      [rejected]     [rejected]    [cancelled]     [disputed]
```

These statuses are loaded dynamically using localization keys, preventing hardcoded English strings in client views.

---

## 4. Voice-Ready & AI preparation

*   **Voice Integration**: The `opportunities` and `applications` tables feature `voice_intro_url` columns, permitting speech uploads (e.g. voice job descriptions, voice introductions) in regional languages.
*   **AI Search Indexes**: Vector search indices (`vector` extension) are pre-allocated to support semantic skill mapping and distance ranking functions.
