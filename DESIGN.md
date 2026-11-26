# Smart-Homework Design System — «Ink & Paper» (`DESIGN.md`)

## Visual Direction: Minimal Ink & Paper

Smart-Homework uses a calm, high-craft **Ink & Paper** design language inspired by Notion, GitHub, and Read.cv — engineered specifically for RTL Persian + LTR code coexistence.
Over 90% of every screen stays crisp, matte neutral so that semantic signals — passing test cases, earned badges, active streaks, and urgent deadlines — earn immediate visual clarity without visual fatigue.

### Anti-AI-Slop Rules (Strict)

1. **No multi-color icon-box KPI cards:** Never render grids of identical rounded boxes containing pastel square icon badges + big numbers. Use a hairline-divided horizontal `.sh-stat-strip` with `tabular-nums` typography.
2. **No decorative gradients or glassmorphism:** Separate elevation with subtle tonal contrast and crisp `1px` hairline borders, not gradient headers, translucent blur bars, or puffy multi-layer drop shadows.
3. **No uniform bubbly radii:** Use disciplined engineering geometry — `6px` for controls/inputs/buttons (`--bs-border-radius`) and `8px` for cards/panels (`--sh-radius-surface`).
4. **True matte neutrals in Dark Mode:** Never use generic blue-tinted `slate-950` backgrounds. Use calibrated matte graphite (`#111113` / `#18181B`) that pairs naturally with the dark cloud VS Code workspace (`#0D1117`).
5. **Consistent icon system:** Use Bootstrap Icons (`bi-*`) and FontAwesome consistently — never use raw emojis as UI icons.

---

## Color Tokens (`html[data-surface="student"]`)

All tokens are scoped under `html[data-surface="student"]` in `apps/prairielearn/public/stylesheets/smart-theme.css`.

### Light Mode (Default Light)

| Token                | Hex       | Role                                    | Contrast Notes                    |
| -------------------- | --------- | --------------------------------------- | --------------------------------- |
| `--sh-bg-canvas`     | `#fafaf9` | Warm neutral paper page canvas          | Base canvas                       |
| `--sh-bg-surface`    | `#ffffff` | Card, table, navbar, modal surface      | Crisp separation via `1px` border |
| `--sh-bg-subtle`     | `#f4f4f2` | Header strips, hoverable rows, tracks   | Subtle surface shift              |
| `--sh-bg-hover`      | `#ecece9` | Interactive hover / active pill surface | —                                 |
| `--sh-border`        | `#e4e4e7` | Default hairline borders & dividers     | —                                 |
| `--sh-border-strong` | `#d4d4d8` | Emphasized controls & inputs            | —                                 |
| `--sh-ink`           | `#18181b` | Primary headings & body text            | 17.4:1 on `#ffffff`               |
| `--sh-ink-secondary` | `#52525b` | Subtitles, metadata, table labels       | 7.5:1 on `#ffffff`                |
| `--sh-ink-muted`     | `#6e6e77` | Captions, placeholders, locked hints    | 5.0:1 on `#ffffff` (passes AA)    |
| `--sh-accent`        | `#18181b` | Primary CTA fill (inverted ink)         | 17.4:1 with `#fafafa`             |
| `--sh-accent-fg`     | `#fafafa` | Text/icon on primary CTA                | —                                 |
| `--sh-link`          | `#0f4c81` | Editorial ink-blue hyperlinks           | 8.6:1 on `#ffffff`                |
| `--sh-success`       | `#15803d` | AC / solved / mastery semantic text     | 5.1:1 on `#ffffff`                |
| `--sh-warning`       | `#b45309` | Streak / medals / warning semantic text | 5.0:1 on `#ffffff`                |
| `--sh-danger`        | `#b91c1c` | Errors / urgent deadline semantic text  | 6.4:1 on `#ffffff`                |

### Dark Mode (`html[data-surface="student"][data-bs-theme="dark"]`)

| Token                | Hex / Value | Role                                    | Contrast Notes                 |
| -------------------- | ----------- | --------------------------------------- | ------------------------------ |
| `--sh-bg-canvas`     | `#111113`   | Matte graphite page canvas              | Zero blue-slate tint           |
| `--sh-bg-surface`    | `#18181b`   | Card, table, navbar, modal surface      | Clean step above canvas        |
| `--sh-bg-subtle`     | `#202024`   | Header strips, hover tracks             | Subtle elevated layer          |
| `--sh-bg-hover`      | `#27272c`   | Interactive hover & active surfaces     | —                              |
| `--sh-border`        | `#27272a`   | Default hairline borders & dividers     | —                              |
| `--sh-border-strong` | `#3f3f46`   | Inputs, strong separators               | —                              |
| `--sh-ink`           | `#f4f4f5`   | Primary headings & body text            | 15.8:1 on `#18181b`            |
| `--sh-ink-secondary` | `#a1a1aa`   | Subtitles, metadata, table labels       | 6.9:1 on `#18181b`             |
| `--sh-ink-muted`     | `#8b8b96`   | Captions, hints                         | 5.2:1 on `#18181b` (passes AA) |
| `--sh-accent`        | `#f4f4f5`   | Primary CTA fill (inverted paper)       | 15.8:1 with `#111113`          |
| `--sh-accent-fg`     | `#111113`   | Text/icon on primary CTA                | —                              |
| `--sh-link`          | `#7db4e8`   | Editorial ink-blue hyperlinks           | 7.9:1 on `#18181b`             |
| `--sh-success`       | `#4ade80`   | AC / solved / mastery semantic text     | 10.6:1 on `#18181b`            |
| `--sh-warning`       | `#fbbf24`   | Streak / medals / warning semantic text | 10.9:1 on `#18181b`            |
| `--sh-danger`        | `#f87171`   | Errors / urgent deadline semantic text  | 6.6:1 on `#18181b`             |

### Theme Switching Behavior

- **Default:** Follows OS `prefers-color-scheme` automatically until the user explicitly toggles the header theme button.
- **Persistence:** Stores manual choice in `localStorage` under `sh-theme` (`"light"` | `"dark"`).
- **Zero-FOUC:** A minimal inline script in `HeadContents.tsx` resolves the theme and writes `data-bs-theme` onto `<html>` before stylesheets paint.

---

## Typography & Directionality

- **Persian UI & Prose:** `Vazirmatn` (`line-height: 1.7`), RTL (`dir="rtl"`).
- **Code, IDs, & Technical Tokens:** `JetBrains Mono` (`direction: ltr; text-align: left; unicode-bidi: isolate`).
- **Tabular Numerals:** Apply `.sh-tabular` (`font-variant-numeric: tabular-nums`) on all scores, percentages, ranks, countdowns, and table numeric columns to prevent horizontal jitter.
- **Inline English Isolation:** Wrap standalone English titles/terms (`First Blood`, `One-Shot`, `Streak`, etc.) inside `.sh-en-term` (`direction: ltr; unicode-bidi: isolate; display: inline-block;`).

---

## Shared Component Inventory (`.sh-*`)

- `.sh-navbar` — 56px matte surface header with `1px solid var(--sh-border)` bottom divider, `.sh-brand-mark`, `.sh-course-pill`, active link underline indicator, and `.sh-theme-toggle`.
- `.sh-mobile-nav` — Fixed bottom tab bar below `768px` (outside `Exam` / LockDown Browser) with safe-area bottom inset and `44px+` touch targets.
- `.sh-stat-strip` / `.sh-stat-cell` — Hairline-divided 4-column desktop / 2×2 mobile summary strip replacing boxed KPI cards.
- `.sh-scorebar` — Compact progress indicator with `[data-score-tier="perfect"|"high"|"mid"|"low"]` and `tabular-nums` percentage readout.
- `.sh-filter-bar` / `.sh-filter-pill` — Clean horizontal filter bar for assessments and leaderboard scopes.
- `.sh-en-term` — Inline LTR bidi-isolated span for English technical & achievement labels.

---

## Accessibility & Browser Surfaces (WCAG 2.2 AA)

- All interactive controls meet ≥ `36px` (desktop) / `44px` (mobile nav & icon buttons) target sizing.
- Distinct `:focus-visible` `2px` outline in `var(--sh-ink)` / `var(--sh-link)` with `2px` offset.
- Styled browser surfaces (`::selection`, `caret-color`, `scrollbar-color`, `text-underline-offset: 0.2em`).
- Full `@media (prefers-reduced-motion: reduce)` support collapsing transitions and animations.
