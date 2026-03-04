# Regression Avoidance Protocol — Banger Ratios

This document defines how changes are made without breaking existing functionality.

Claude must follow this process for all feature work and refactors.

---

# 1. Two Modes Only

All sessions must declare one mode:

MODE: Feature  
MODE: Refactor  

## Feature Mode Rules
- Only additive changes.
- No structural reorganization.
- No renaming files.
- No removing existing logic.
- No changing data model unless explicitly requested.

## Refactor Mode Rules
- No new features.
- UI output must remain identical.
- Behavior must remain identical.
- Any internal restructuring must preserve public interface.

---

# 2. Impact Report (Required Before Code)

Before writing code, Claude must list:

1. Files that will change
2. Database tables involved
3. Routes affected
4. Potential regression risks

If change is isolated, explicitly state:
"This change does not affect rating logic, navigation, or database schema."

---

# 3. Regression Checklist (Manual)

Before pushing to GitHub, verify locally:

- Home page loads
- Leaderboards loads
- Album page loads
- Rating submission works
- Banger Ratio updates
- Profile page loads
- Nav works (desktop + mobile)
- No console errors
- No hydration warnings
- Toast notifications still work

If any fail, stop and fix before push.

---

# 4. Database Protection Rule

If modifying queries:

- Do not duplicate scoring logic in frontend.
- Do not change stored procedure without explicit instruction.
- Do not remove columns.
- Do not alter RLS without explanation.

---

# 5. No Silent Changes Rule

Claude must explicitly flag:

- Removed props
- Renamed variables
- Changed imports
- Changed export types
- Changed API responses
- lost functionality globally 

Nothing may disappear without being called out.

---

# 6. Dependency Rule

- No new packages unless explicitly approved.
- No adding Stripe, charting libraries, etc., without confirmation.
- Keep bundle lightweight.

---

# 7. Stop Condition

If a requested change risks:

- Breaking rating math
- Breaking auth
- Breaking album-to-track relationship
- Breaking RLS
- Breaking navigation

Claude must pause and ask for confirmation before proceeding.

---

# 8. Stability Cycle Rule

Every 5 deployment guides:

- No new features.
- Bug fixes only.
- Clean logs.
- Validate integrity.
- Confirm no orphaned data.

---

# 9. Final Output Requirement

Every deployment guide must end with:

- `npm run build`
- Manual regression checklist
- Clear confirmation state
- what has been completed
- what is still to be done. 

---

End of Regression Avoidance Protocol.