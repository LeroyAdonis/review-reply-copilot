# Design Language: Review Reply Copilot

> Auto-generated from the active implementation. Not aspirational — this IS the current design system.

## Colors

| Token | Value | Usage |
|---|---|---|
| `surface` | #fafaf9 | Page background |
| `surface-secondary` | #ffffff | Cards, inputs, elevated surfaces |
| `surface-tertiary` | #f5f4f1 | Stat cards, subtle section bg |
| `content` | #171717 | Primary text, headings (18.4:1 AAA) |
| `content-secondary` | #404040 | Supporting text, labels (11.8:1 AAA) |
| `content-tertiary` | #6b6b6b | Captions, timestamps (4.8:1 AA) |
| `accent` | #1a1a1a | Primary buttons, brand elements |
| `accent-hover` | #333333 | Button hover state |
| `border-subtle` | #e8e6e1 | Card borders, separators |
| `border-hover` | #d4d1cb | Interactive border hover |
| `success` | #16a34a | Positive status, approved |
| `warning` | #d97706 | Pending approval |
| `error` | #dc2626 | Destructive actions, negative |

### Dark Mode
Surfaces invert to near-black (#0d0d0d → #1a1a1a). Content inverts to off-white (#ededed). Accent becomes light (#fafaf9).

## Typography

| Style | Size | Weight | Leading | Usage |
|---|---|---|---|---|
| Heading XL | 2.25rem (4xl) | 600 | tight | Hero headlines |
| Heading L | 1.5rem (2xl) | 600 | tight | Page titles |
| Heading M | 1.25rem (xl) | 600 | tight | Section headers |
| Body | 1rem (base) | 400 | relaxed | Paragraph text |
| Body S | 0.875rem (sm) | 400 | normal | Supporting text |
| Caption | 0.75rem (xs) | 400-500 | normal | Labels, timestamps |

**Font:** Inter (Google Fonts, via next/font)

## Spacing

Tailwind default scale (0.25rem = 4px base). All values in rem.

| Context | Value |
|---|---|
| Section padding | py-16 lg:py-24 |
| Card padding | p-6 |
| Card gap | gap-4 to gap-6 |
| Button height | h-11 (44px) |
| Button padding | px-5 to px-6, py-3 |
| Input height | h-11 (44px) |
| Form field gap | mb-5 |

## Shapes

| Element | Radius | Border |
|---|---|---|
| Cards | rounded-xl (0.75rem) | 1px border-subtle |
| Buttons | rounded-lg (0.5rem) | — |
| Inputs | rounded-lg (0.5rem) | 1px border-subtle |
| Stat cards | rounded-lg (0.5rem) | — |
| Focus ring | rounded-sm (0.25rem) | 2px solid accent |

## Components

### Buttons (6 states)
- Default: bg-accent, text-white (inverted on accent), h-11, rounded-lg
- Hover: bg-accent-hover
- Active: scale-[0.98]
- Focus: outline-2, outline-accent, outline-offset-2
- Disabled: opacity-50, cursor-not-allowed
- Loading: spinner replaces label

### Inputs (5 states)
- Default: border border-subtle, bg-surface-secondary
- Focus: border-accent, ring-2 ring-accent ring-offset-1
- Filled: border-border-subtle
- Error: border-error, bg-error/5
- Disabled: opacity-50, bg-surface-tertiary

### Cards
- bg-surface-secondary, border border-subtle, rounded-xl
- p-6 padding
- Subtle shadow-sm on hover (interactive cards)

### Stat Cards
- bg-surface-tertiary, rounded-lg
- Label: text-xs, uppercase, tracking-wide, content-tertiary
- Value: text-lg, font-bold, content (or warning for alerts)

### Empty States
- Centered icon (w-16 h-16, rounded-2xl, bg-surface-tertiary)
- Heading: text-2xl, font-semibold
- Description: text-sm, content-secondary, max-w-sm
- Primary CTA: full button spec
- Secondary: muted text link

## Anti-Patterns (NEVER)

- Raw Tailwind gray classes (text-gray-*, bg-gray-*)
- Double-prefix token names (text-text-*, bg-bg-*)
- Center-aligned body text
- Three identical icon-circle feature cards
- Purple/blue/neon gradients
- Decorative blobs, floating shapes
- Text at opacity (use actual lighter color value)
- Missing focus indicators
