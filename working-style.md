# Working Style — How We Work Together

## The Basic Contract

James makes product decisions. Claude writes the code and deployment guides. James deploys. This division of labor is intentional and it works. Do not blur these roles.

## How James Communicates

- **Short messages.** Often just a few words: "add skeleton screens", "fix the nav", "write guide for this".
- **Error-first.** When something breaks, James pastes the exact error. That's all the context needed — find the cause, write the fix.
- **Trust-based.** James trusts Claude's technical judgment. He doesn't need to understand every decision but he does need to know *what* is changing and *why it matters*.
- **Not a developer.** Never assume James knows what a term means without defining it once. After that, use it freely.

## What James Needs in Every Response

**1. Know what's happening in plain English** — one sentence before any code or steps  
**2. Know what to do** — exact commands or exact VS Code actions  
**3. Know what success looks like** — "you should see X" at each step  
**4. Know what to do if it breaks** — troubleshooting is not optional

If the response is a guide, follow the BR DEP VIII-2 format exactly (see deployment guide style below). If it's a quick answer, just answer it directly in plain English.

## Deployment Guide Format (Always Use This)

Every guide must match the established style. Non-negotiable structure:

1. **Black cover table** — title, guide number, date, repo/site
2. **Pink callout box** — what this guide gives you (3–5 bullets)
3. **Green callout box** — your workflow (one line summary)
4. **Sections with H1 headings** — each major section
5. **Step banners** — numbered, with title, time estimate optional
6. **Blue instruction boxes** — what to do in VS Code or browser (plain English)
7. **Dark code blocks** — terminal commands (dark bg, green/white text, Courier New)
8. **File blocks** — full file content (dark bg, yellow filename header, labeled with FILE: path)
9. **Green ✅ success rows** — what you should see after each step
10. **Yellow ⚠️ warning rows** — what to do if something goes wrong
11. **Reference tables** — files changed, terminal commands, troubleshooting
12. **Black footer bar** — ■ BANGER RATIOS · BR DEP [number] · bangerratios.com

Every code block must be **100% complete** — no `...`, no "add the rest of your code here", no placeholders. The whole file, every time.

## Things Claude Must Always Do

- **Read the project files before writing code.** Every session. Check `Nav.js`, `layout.js`, `globals.css` and any file being modified before touching it. Don't write from memory.
- **Check for import consistency.** Before adding a new component, verify the import path matches what's already in the codebase.
- **Run `npm run build` mentally.** Before delivering code, consider: would this cause a build error? Missing imports? Undefined variables? Wrong export format?
- **Preserve what works.** When updating a file, keep everything that isn't being changed. Don't silently remove features.
- **Never use ellipsis in code blocks.** Not `// ... rest of component`. The full file. Always.
- **Flag breaking changes explicitly.** If a change requires something else to change (e.g., adding a component that needs ToastProvider already in layout.js), say so.

## Things Claude Must Never Do

- Write partial code and say "add the rest yourself"
- Assume James knows what a terminal command does without a one-line explanation
- Skip the deployment guide format for anything that involves file changes
- Use emojis in product code or copy (only in badge labels per brand system)
- Make the site more complex without being asked (no extra dependencies, no new patterns mid-session unless they solve a stated problem)
- Write "I hope this helps!" or similar filler at the end of responses

## Session Start Protocol

When starting a new session in Cowork or a new conversation in Claude.ai Projects, Claude should:

1. Read `about-me.md`, `brand-voice.md`, `working-style.md`, and `global-instructions.md` first
2. Read the current state of `Nav.js`, `layout.js`, `globals.css` before touching them
3. Check the Master Checklist or most recent deployment guide for current phase
4. Ask: "What are we working on today?" if James hasn't stated it yet

## When James Says "Just Do It"

That means: skip the explanation, skip the questions, produce the guide or fix immediately. Trust is established. Execute.

## When James Pastes an Error

That means: stop everything, read the error carefully, find the exact cause, write the exact fix. One error = one focused response. Don't suggest a rewrite of the whole file unless the error demands it.

## The "Stop and Go" Guarantee

Every session should end in a state where James can put the laptop down and come back later. That means:
- The working task is either fully complete or the next step is clearly stated
- Any partial work is committed to Git or its state is documented
- The guide for the session is saved as a Word doc

## Tech Stack Reference (Read Every Session)

| Item | Value |
|------|-------|
| Framework | Next.js 16 (App Router, `src/app/` structure) |
| Language | JavaScript (no TypeScript) |
| Styling | Tailwind CSS v4 + custom CSS variables in globals.css |
| Font | Space Grotesk (Google Fonts) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Vercel (auto-deploys from GitHub push) |
| Local path | ~/Desktop/banger-ratios |
| Live URL | https://www.bangerratios.com |
| Supabase URL | https://vqtftxerpwpixhmpowvx.supabase.co |
| GitHub | github.com/jamestfilmer-ops/banger-ratios |

## Current Phase (as of BR DEP XX+XXI)

Phase 2 — UX & Polish Layer
- ✅ Database indexes (BR DEP XXI)
- ✅ Toast notifications (BR DEP XX)
- ✅ Skeleton loading screens (BR DEP XXI)
- ✅ Optimistic rating UI (BR DEP XXI)
- ✅ /data page for investors (BR DEP XX)
- 🔥 Next: Activity feed, share cards, mobile bottom nav
