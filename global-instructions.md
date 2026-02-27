# Global Instructions — Banger Ratios Project

## Read This First, Every Session

This is the master context file for the Banger Ratios project. Read this before anything else. Then read the other context files in this order:

1. `about-me.md` — who James is, his background, his goals
2. `brand-voice.md` — how Banger Ratios sounds, looks, and what it is
3. `working-style.md` — how we work together, formats, rules
4. Current code files: `Nav.js`, `layout.js`, `globals.css` (always read before modifying)

---

## Project Identity

**Name:** Banger Ratios  
**URL:** https://www.bangerratios.com  
**Tagline:** Rate every track. See the Banger Ratio. Settle the debate.  
**Founded by:** James Filmer, Nashville TN  
**Mission:** Turn music opinions into comparable data. Community-powered album quality scores.

---

## Technical Stack

```
Framework:    Next.js 16 (App Router)
Language:     JavaScript (NO TypeScript)
Styling:      Tailwind CSS v4 + CSS variables in globals.css
Font:         Space Grotesk (Google Fonts)
Database:     Supabase (PostgreSQL + Auth + Storage + RLS)
Hosting:      Vercel (auto-deploy from GitHub)
```

---

## Critical Paths

```
Local project:   ~/Desktop/banger-ratios
Live site:       https://www.bangerratios.com
Supabase:        https://vqtftxerpwpixhmpowvx.supabase.co
GitHub:          github.com/jamestfilmer-ops/banger-ratios
Vercel:          vercel.com → banger-ratios project
Local test:      http://localhost:3000
```

---

## Database Schema (Current)

**Tables in Supabase:**
- `profiles` — user profiles (id, username, display_name, bio, avatar_url, banner_url, spotify_id, is_pro)
- `albums` — albums (id, itunes_collection_id, name, artist_name, artwork_url, genre, total_ratings, banger_ratio)
- `tracks` — tracks (id, album_id, name, track_number)
- `ratings` — user ratings (id, user_id, track_id, album_id, score 1–7)
- `follows` — social follows (id, follower_id, following_id)

**RLS:** Enabled on all tables. Users can only write their own rows. Anyone can read.

**Key function:** `recalculate_banger_ratio(p_album_id)` — stored procedure that recalculates Bayesian-calibrated banger ratio after ratings are submitted.

**Bayesian formula:**  
- Prior mean: 4.0, Weight: 1.0, Banger threshold: 5.0  
- calibrated_avg = (sum_scores + 4.0) / (count + 1.0)  
- Track is "banger" if calibrated_avg ≥ 5.0  
- Banger Ratio = (banger_tracks / total_tracks) × 100  
- Fixed in BR DEP XIX. Do not change without explicit instruction.

---

## Current Navigation Structure

```javascript
const tabs = [
  { href: '/',             label: 'Home' },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/releases',     label: 'New Releases' },
  { href: '/friends',      label: 'Friends' },
  { href: '/data',         label: 'Data' },
  { href: '/merch',        label: 'Merch' },
  { href: '/about',        label: 'About' },
]
```

---

## Design Tokens (globals.css)

```css
--pink:       #FF0066    /* primary CTA, active states, accents */
--pink-hover: #E6005C
--black:      #111111    /* headlines, body */
--gray-text:  #6B7280
--border:     #E5E7EB
--bg-soft:    #F4F6F8
```

Font: Space Grotesk, body text.  
Background: soft gray gradient with pink radial glow behind everything.

---

## Components That Exist

| Component | Path | What it does |
|-----------|------|-------------|
| Nav.js | src/app/components/Nav.js | Sticky top nav with mobile hamburger |
| NewsBanner.js | src/app/components/NewsBanner.js | Scrolling news ticker at top |
| Footer.js | src/app/components/Footer.js | Site footer |
| ToastContext.js | src/app/components/ToastContext.js | Toast notification system |
| Skeleton.js | src/app/components/Skeleton.js | Shimmer loading skeletons |

---

## Pages That Exist

| Page | Path | Status |
|------|------|--------|
| Home | src/app/page.js | Live |
| Albums | src/app/albums/page.js | Live |
| Album detail | src/app/album/[id]/page.js | Live |
| Leaderboards | src/app/leaderboards/page.js | Live |
| New Releases | src/app/releases/page.js | Live |
| Artists | src/app/artists/page.js | Live |
| Friends | src/app/friends/page.js | Live |
| Profile | src/app/profile/page.js | Live |
| Public profile | src/app/profile/[username]/page.js | Live |
| Auth | src/app/auth/page.js | Live |
| Data | src/app/data/page.js | Live (BR DEP XX) |
| About | src/app/about/page.js | Live |
| Merch | src/app/merch/page.js | Live |
| Settings | src/app/settings/page.js | Live |

---

## What's Been Built (Completed Guides)

| Guide | What it did |
|-------|-------------|
| BR DEP I–VII | Initial build: auth, database, pages, core rating system |
| BR DEP VIII | Social features, responsive design, security, profile banners |
| BR DEP IX–XIV | Bug fixes, autopatcher, various stability fixes |
| BR DEP XIX | Fixed Bayesian formula (critical — don't break this) |
| BR DEP XX | /data page, Toast system, Nav update |
| BR DEP XXI | Skeleton screens, Optimistic UI, Database indexes |

---

## Current Phase: Phase 2 — UX & Polish

Completed this phase:
- ✅ Database indexes
- ✅ Toast notification system
- ✅ Skeleton loading screens
- ✅ Optimistic rating UI
- ✅ /data investor page

Next priorities (Phase 3 — Retention Engine):
- 🔥 Activity feed (what followed users are rating)
- 🔥 Share card generator (user shares their Banger Ratio on social — fastest growth lever)
- ⚡ Mobile bottom navigation
- ⚡ Taste compatibility score
- ⚡ Cursor pagination (replace offset queries)

Phase 4 — Revenue:
- 💰 Stripe Pro tier ($4.99/month)
- 💰 CSV export for Pro users
- 💰 profiles.is_pro flag + checkout route

Phase 5 — Investor Surface:
- 📊 /admin dashboard (protected)
- 📊 /data page enhancements
- 📊 Press/media kit page

---

## The Deploy Workflow (Memorize This)

```
cd ~/Desktop/banger-ratios
[make changes]
npm run dev           → test at localhost:3000
npm run build         → MUST PASS before pushing
git add .
git commit -m "describe change"
git push              → Vercel auto-deploys in ~60 seconds
```

**NEVER push if npm run build has errors.**

---

## Rules for Every Session

1. **Read current file contents before modifying them.** Never write from memory.
2. **Full file content in every code block.** No `...`, no partial code.
3. **Every guide in BR DEP VIII-2 format.** Black cover, pink boxes, green checkboxes, dark code blocks.
4. **One sentence plain English before every code block** explaining what it does.
5. **Every step has a success check and a troubleshooting note.**
6. **Flag breaking changes.** If adding X requires Y to also change, say so explicitly.
7. **npm run build must pass** before any guide ends with a push step.

---

## About James (Quick Reference)

- CFP in Nashville, TN
- Zero coding experience — deploys via Terminal commands and VS Code Cmd+A delete paste
- New dad, limited time, works in short sessions
- Needs to stop and pick up exactly where he left off
- Christian values — no dark patterns, no manipulation
- Goal: make Banger Ratios a real business before financial advisory becomes automated out of existence
- Treat him like a smart non-technical founder, not a beginner who needs everything explained twice
