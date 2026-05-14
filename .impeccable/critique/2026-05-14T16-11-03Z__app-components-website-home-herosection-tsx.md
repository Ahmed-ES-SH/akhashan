---
target: HeroSection.tsx
total_score: 34
p0_count: 0
p1_count: 2
p2_count: 3
p3_count: 1
timestamp: 2026-05-14T16-11-03Z
slug: app-components-website-home-herosection-tsx
---
# Critique: HeroSection.tsx

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Scroll-opacity effect provides subtle feedback; no async operations to report on |
| 2 | Match System / Real World | 4 | Language, trust signals, and CTAs perfectly match Saudi recruitment context |
| 3 | User Control and Freedom | 4 | Two clear CTA paths (contact, WhatsApp); standard navigation flow |
| 4 | Consistency and Standards | 2 | Unused motion imports, CSS variable `--p-deco-intensity` never defined, empty wrapper div |
| 5 | Error Prevention | 4 | N/A for static hero section; no inputs to protect |
| 6 | Recognition Rather Than Recall | 4 | All content visible on screen; nothing hidden |
| 7 | Flexibility and Efficiency | 3 | Two CTA options is appropriate; no keyboard support needed |
| 8 | Aesthetic and Minimalist Design | 2 | Pure black overlay violates brand palette; dead code clutter; decorative SVG oddly scaled |
| 9 | Error Recovery | 4 | N/A |
| 10 | Help and Documentation | 4 | N/A |
| **Total** | | **34/40** | **Good** |

## Anti-Patterns Verdict

**Does it look AI-generated? Partially.**

**LLM assessment**: The component escapes the worst AI slop tells — no gradient text, no glassmorphism, no hero-metric template, no identical card grids. The gold-accent badge, dark atmosphere, and dual CTA pattern are intentional and appropriate for the brand. However, the overall structure (centered stack with badge → heading → description → trust signal → CTAs) is a common hero template. Two things guard it from feeling generic: the dark gold-accented color scheme and the radial gradient atmospheric overlays. But the pure `bg-black` (line 54) is a tell — it's the nearest-color reflex instead of using the brand's charcoal. The unused `framer-motion` imports also signal bulk-generated code that wasn't cleaned up.

**Deterministic scan**: 1 finding — `bg-black` on line 54. Pure black background overlay flagged as a warning. Should use a charcoal tinted toward brand green (e.g., `#1E1E1E` or OKLCH equivalent).

## Overall Impression

A structurally sound hero section that communicates trust and authority through gold accents and a dark premium atmosphere. The bones are right — badge hierarchy, compelling headline space, clear trust signal, dual CTAs — but three things hold it back from feeling crafted: the pure-black overlay (reflex choice vs brand choice), dead Framer Motion setup (code that suggests bulk generation), and a decorative SVG that is under-scaled and hidden on mobile. Clean those and this becomes genuinely polished.

## What's Working

1. **Gold-accent badge as a trust opener** — The `FiStar` icon inside a pill with gold border/bg is purposeful. It signals "this is an official, recognized entity" before the visitor reads anything. Appropriate for the trust-first design principle.

2. **Radial gradient atmosphere layers** — The double `radial-gradient` overlay (gold fade at 30%/40%, white mist at 70%/60%) adds depth to the hero background without visual noise. This is restrained decoration done well, exactly matching "Premium without excess."

3. **License/trust signal integration** — The `FiShield` + license text in a bordered pill is placed between description and CTAs, exactly where a skeptical visitor needs reassurance before clicking. Good information architecture.

## Priority Issues

### [P1] Pure black overlay violates brand palette

- **What**: Line 54 uses `bg-black` (`#000`) for the hero overlay between the background image and content.
- **Why it matters**: DESIGN.md explicitly specifies Charcoal `#1E1E1E` for dark backgrounds. Pure black reads as generic/unrefined and is listed in the shared design laws under "Never use #000 or #fff."
- **Fix**: Replace `bg-black/50` with `bg-[#1E1E1E]/50` or an OKLCH equivalent tinted toward the brand green.
- **Suggested command**: `colorize HeroSection.tsx`

### [P1] Dead Framer Motion setup (unused imports and variants)

- **What**: Lines 6, 12-26 import `motion` from framer-motion and define `fadeSlideDown` and `fadeUp` variants, but none are used anywhere in the JSX. The scroll-opacity effect (lines 34-44) is implemented via raw DOM manipulation instead.
- **Why it matters**: Dead code signals lack of polish and suggests bulk-generated code. It also creates a maintenance burden — future editors may wonder if these are used elsewhere.
- **Fix**: Either wire the motion variants into the component (staggered entrance reveals for badge → heading → description → trust → CTAs would elevate the hero significantly) or remove the unused imports entirely.
- **Suggested command**: `polish HeroSection.tsx` or `animate HeroSection.tsx`

### [P2] CSS variable `--p-deco-intensity` referenced but never defined

- **What**: Line 111 uses `style={{ opacity: "var(--p-deco-intensity, 0.5)" }}` but the variable is never set anywhere in the component or its parents.
- **Why it matters**: The decorative SVG always renders at default 0.5 opacity. If the variable was intended for scroll-based or theme-based control, it's not wired up. If not, use a fixed value and remove the variable pattern.
- **Fix**: Either define the variable (e.g., via JS or CSS), or replace with a static `opacity-50` class.
- **Suggested command**: `polish HeroSection.tsx`

### [P2] Hero image missing `priority` prop

- **What**: Line 55-61 renders the background Image without a `priority` prop.
- **Why it matters**: This is a hero background image above the fold. Without `priority`, Next.js lazy-loads it by default, hurting LCP performance. For a trust-first brand page, load speed is credibility.
- **Fix**: Add `priority` to the Image component.
- **Suggested command**: `harden HeroSection.tsx`

### [P2] Generic alt text on primary image

- **What**: Line 58: `alt="Hero Background"`.
- **Why it matters**: Alt text is part of the brand voice per the brand register. "Hero Background" is technical — it describes the file's role, not what the image shows.
- **Fix**: Use descriptive alt text reflecting the image content (e.g., "Professional office environment in Riyadh" or similar).
- **Suggested command**: `clarify HeroSection.tsx`

### [P3] Wrapper div with empty className

- **What**: Line 66: `<div className={``}>` wraps the content with no purpose.
- **Why it matters**: Redundant DOM node adds nothing.
- **Fix**: Remove the wrapper.
- **Suggested command**: `polish HeroSection.tsx`

## Persona Red Flags

### Noura (Decision-Maker, Business Owner)
- **Need**: Evaluate trustworthiness quickly from the hero alone.
- **Red flags**: 
  - The scroll-opacity effect on the hero background could cause Noura to perceive the site as unpolished if she scrolls before the content fully loads (the overlay dims to 30% min opacity, making text harder to read over a potentially bright image at scroll).
  - Pure black overlay may feel cheap compared to a charcoal tint — Noura has seen enough professional sites to notice the difference subconsciously.

### Jordan (First-Time Visitor)
- **Need**: Understand what this company does within 3 seconds.
- **Red flags**:
  - The heading uses `dangerouslySetInnerHTML`, which means copy can contain rich formatting. If the translation data returns HTML with broken tags, Jordan sees raw markup — no error boundary around this.
  - If the background image fails to load or is slow (no `priority`), Jordan sees a black screen with content, which feels broken.

### Ahmed (Bilingual Saudi User)
- **Need**: Seamless RTL experience in Arabic.
- **Red flags**:
  - The RTL/LTR handling uses conditional class switching (`${locale === "ar" ? "text-right" : "text-left"}`) instead of CSS logical properties. This works for text alignment but doesn't handle other RTL concerns (icon ordering, the decorative SVG star direction).
  - If the background image contains text or culturally inappropriate content for Saudi Arabia, it would undermine trust entirely.

## Minor Observations

- The decorative SVG star shape (line 140-145) is a nice touch but at `max-w-sm` in a full-viewport hero, it's barely perceptible. Consider making it larger or removing it.
- `mb-8` (line 78), `mb-10` (line 82), and other spacing values suggest a manual spacing approach rather than a systematic scale. This works but makes global spacing changes costly.

## Questions to Consider

1. The Framer Motion infrastructure is imported but unused. What if the hero elements staggered in on load — badge first, then heading, then trust signal, then CTAs? Would that amplify the premium feel without over-animating?
2. The decorative SVG is hidden on mobile but small on desktop (max-w-sm). Is the current size intentional, or could it be enlarged to fill the negative space on the right side?
3. The pure black overlay — was this a deliberate choice, or a default that wasn't revisited?
