# Brand Voice — Banger Ratios

## The One-Line Brand Truth

**Banger Ratios turns music opinions into math — and makes the math the argument.**

## What Banger Ratios Is

A community music rating platform where users rate every track on an album 1–7. The platform calculates a "Banger Ratio" — the percentage of tracks that score 5.0 or above. This turns subjective taste into a comparable number that can be debated, shared, and ranked.

It is not a streaming platform. It is not a review site. It is a **data company built for music fans who like to argue with evidence.**

## Brand Personality

**Confident.** We believe track-by-track data is more honest than critic reviews or stream counts. We don't hedge this.

**Direct.** Short sentences. No filler. No "it's complicated." The product speaks for itself.

**A little edgy.** The name is "Banger Ratios." The primary color is hot pink (#FF0066). This is intentional. We're not trying to appeal to everyone.

**Credible without being stuffy.** We use real methodology (Bayesian-calibrated scoring, prior=4.0, m=1.0, threshold=5.0). We explain it plainly. We don't hide behind jargon but we don't dumb it down either.

**Human.** Two music fans in Nashville who got tired of arguing without data. That's the founding story. Keep it in.

## Voice in Practice

| Situation | Right tone | Wrong tone |
|-----------|-----------|------------|
| Homepage headline | "Rate every track. See the Banger Ratio. Settle the debate." | "Welcome to our music community platform!" |
| Empty state | "No albums rated yet. Be the first." | "It looks like there's nothing here yet!" |
| Error message | "Something went wrong. Try again." | "Oops! We had a little hiccup 😅" |
| Badge label | "💎 Certified Classic" | "Amazing! This album is really great!" |
| Data description | "Track-by-track community quality data." | "See what other music lovers think!" |

## What We Never Do

- Use exclamation points in product copy (they cheapen it)
- Use emoji in body copy or error messages (only in badge labels where they're part of the brand system)
- Use vague superlatives ("amazing," "incredible," "best")
- Write like a corporate press release
- Apologize for being opinionated about music

## Design Language

**Primary color:** #FF0066 (hot pink) — used for CTAs, active states, badges, accents  
**Black:** #111111 — headlines, body text  
**Background:** Soft gray gradient (#F4F6F8 → #f0f2f5) with a pink radial glow behind everything  
**Font:** Space Grotesk — geometric, modern, slightly quirky. Matches the brand.  
**Border radius:** 12–14px on cards, 8–10px on buttons. Rounded but not bubbly.  
**Code blocks in guides:** Dark background (#1A1A1A), green text, Courier New

**The visual feeling:** Like Spotify built a statistics product and hired someone with good taste to design it.

## Badge System (Core Brand Element)

These must never change. They are the product's most recognizable visual.

| Score | Badge |
|-------|-------|
| 90–100% | 💎 Certified Classic |
| 75–89% | 🥇 Solid Gold |
| 60–74% | 🎵 Hit or Miss |
| 40–59% | ⚠️ Filler Warning |
| 0–39% | ❌ Skip It |

## Rating Scale (Core Brand Element)

| Score | Label | Meaning |
|-------|-------|---------|
| 7 | Perfect | A masterpiece of a track. Flawless. |
| 6 | Great | Excellent. In regular rotation. |
| 5 | Good | **Solid track. This is the banger threshold.** |
| 4 | OK | Decent but forgettable. |
| 3 | Meh | Filler. Would not seek it out. |
| 2 | Bad | Actively drags the album down. |
| 1 | Awful | Skip every time. |

## Methodology (Non-Negotiable)

Banger Ratio uses Bayesian-calibrated scoring:
- Prior mean: 4.0
- Weight (m): 1.0  
- Banger threshold: 5.0
- Formula: calibrated_avg = (sum_of_scores + prior*m) / (count + m)
- A track is a "banger" if its calibrated average ≥ 5.0
- Banger Ratio = (banger tracks ÷ total tracks) × 100

This was fixed in BR DEP XIX. Do not change the formula without flagging it explicitly.

## Audience

**Primary:** Music fans who are data-minded. 18–35. Likely also use RateYourMusic, Reddit music communities, or argue about albums on social media.

**Secondary:** Music industry professionals — A&R, labels, journalists — who want to point at community data rather than just stream counts.

**Investor-facing:** The /data page exists specifically to show traction metrics to anyone evaluating the platform. Keep it clean, factual, and updated.
