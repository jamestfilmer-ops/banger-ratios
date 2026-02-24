# BR GPT DEPL 2

## Goal
Improve leaderboard organization by adding ranking modes.

## Files Modified
- src/app/leaderboards/page.js

## Changes
1. Added ranking mode state (Top Rated / Most Rated / Hidden Gems)
2. Made Supabase query ordering dynamic
3. Added simple UI toggle above leaderboard list

## Why
Leaderboard should feel authoritative and dynamic.
This improves depth without changing layout or design language.

## Risk Level
Low. Only affects query ordering and UI toggle.

## Rollback
Remove ranking mode state + restore original .order('banger_ratio').
