# Engineering Invariants — Banger Ratios

This document defines the non-negotiable technical rules of the system.

Claude must read this before writing or modifying any code.

If a proposed change violates an invariant, it must be explicitly flagged before implementation.

---

# 1. Core Product Invariants

These define what Banger Ratios fundamentally is.

## 1.1 Rating System

- Ratings are 1–7 integers only.
- All rating math is authoritative in the database.
- The stored procedure `recalculate_banger_ratio(p_album_id)` is the single source of truth.
- The Bayesian formula (BR DEP XIX) must never be duplicated or reimplemented in frontend code.
- Frontend may display results, but may not calculate core scoring logic independently.

If rating logic is touched, it must be explicitly acknowledged.

---

## 1.2 Banger Ratio Calculation

Fixed values:
- Prior mean = 4.0
- Weight (m) = 1.0
- Banger threshold = 5.0

Formula:
calibrated_avg = (sum_scores + 4.0) / (count + 1.0)

A track is a "banger" if calibrated_avg ≥ 5.0

Banger Ratio = (banger_tracks / total_tracks) × 100

This must not change unless explicitly instructed.

---

# 2. Data Model Invariants

These relationships must always remain valid.

## albums
- Each album must have:
  - id
  - itunes_collection_id
  - name
  - artist_name
  - artwork_url

## tracks
- Each track must:
  - Belong to exactly one album (album_id required)
  - Have a valid track_number

## ratings
- Each rating must:
  - Belong to one user (user_id)
  - Belong to one track (track_id)
  - Belong to one album (album_id)
  - Have a score 1–7

## profiles
- Each profile corresponds to one Supabase auth user.
- profiles.id must match auth.user.id.

No silent schema changes.
No column renaming without explicit approval.
No removing columns to “clean things up.”

---

# 3. UI/Navigation Invariants

The following routes must always exist and load:

- /
- /leaderboards
- /releases
- /friends
- /data
- /merch
- /about
- /album/[id]
- /profile
- /profile/[username]

The navigation structure must not be altered unless explicitly requested.

Mobile navigation must continue to function.

---

# 4. File Structure Invariants

- Framework: Next.js App Router
- Language: JavaScript (no TypeScript)
- Styling: Tailwind + globals.css variables
- No introducing new frameworks.
- No converting project to TypeScript.
- No adding new dependencies unless explicitly approved.

All code blocks in deployment guides must include full file contents.

No ellipsis.
No partial snippets.

---

# 5. Feature Preservation Rule

When modifying a file:

- All existing functionality must remain unless explicitly removed.
- No “refactor while we’re here” behavior.
- No renaming exports unless required and flagged.
- No changing component signatures without explicit explanation.

Additive changes preferred.
Subtractive changes require confirmation.

---

# 6. RLS and Security Invariants

- RLS remains enabled on all tables.
- Users can only write their own rows.
- Public read remains allowed.
- No bypassing RLS via service keys in frontend.

If database access pattern changes, it must be explicitly explained.

---

# 7. Deployment Invariant

`npm run build` must pass before push.

No guide may end in a state where the project does not build successfully.

---

# 8. Regression Acknowledgement Requirement

Before writing code, Claude must state:

- What invariants are relevant.
- Whether the change affects rating logic.
- Whether the change affects schema.
- Whether the change affects navigation.

If none are affected, explicitly say so.

---

End of Engineering Invariants.