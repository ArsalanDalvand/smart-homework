# Smart-Homework Design System — «Nova Studio» (`DESIGN.md`)

## Visual Direction: Expressive Studio + IDE Precision

Smart-Homework uses the **Nova Studio** design language — pairing a luminous **Daylight Studio** light surface with an **Obsidian IDE Studio** dark mode tailored for Persian RTL engineering workflows and LTR Python code execution.

Unlike harsh monochrome UIs, Nova Studio pairs clean neutral surfaces with a disciplined **Electric Cobalt** primary accent (`#2563EB` / `#3B82F6`), warm **Amber** streak/medal cues, **Emerald** mastery/AC signals, and **Cyan** gradient accents — giving students tactile depth, clear focal hierarchy, and comfortable readability across problem statements, scoreboards, skill trees, and cloud VS Code.

### Core Craft Rules

1. **Guaranteed CTA Contrast:** Primary actions (`.btn-primary`) ALWAYS carry an Electric Cobalt surface with crisp `#FFFFFF` foreground across rest, hover, focus, and active states — even inside `.card-header`.
2. **Unified Problem-Statement & IDE Surfaces:** Course-styled question cards (`.bp-task-box`), callouts, sample I/O tables, inline `code` pills, and the Ace code editor automatically synchronize with `data-bs-theme="dark" | "light"` (`github_dark` / `github_light_default`).
3. **Dimensional Separation:** Cards use `14px` radius (`--sh-radius-surface`), controls use `10px` radius (`--sh-radius-control`), subtle ambient depth (`--sh-shadow-card`), and a sticky frosted navbar (`backdrop-filter: blur(14px)`).
4. **Directional Integrity:** Persian copy uses `Vazirmatn` (`dir="rtl"`, `line-height: 1.75`); code, sample I/O, math, and tabular scores isolate via `JetBrains Mono` / `.sh-tabular` / `.sh-en-term` (`unicode-bidi: isolate`) so RTL counters never invert around English tokens.
5. **Consistent Iconography:** Bootstrap Icons (`bi-*`) and FontAwesome icons across all UI chrome (never raw emojis inside UI chrome).

---

## Color Tokens (`html[data-surface="student"]`)

All tokens live in [apps/prairielearn/public/stylesheets/smart-theme.css](file:///home/a7vat4r/projects/arsalandalvand/PrairieLearn/apps/prairielearn/public/stylesheets/smart-theme.css). Instructor, TA, and admin pages outside `data-surface="student"` keep Layer 1b untouched.

### Light Mode — Crisp Daylight Studio (`data-bs-theme="light"`)

| Token                | Value     | Role                                          |
| -------------------- | --------- | --------------------------------------------- |
| `--sh-bg-canvas`     | `#f3f6fb` | Cool daylight canvas with subtle top radial   |
| `--sh-bg-surface`    | `#ffffff` | Elevated card, table, and modal surface       |
| `--sh-bg-subtle`     | `#f8fafc` | Section headers, tracks, hover base           |
| `--sh-bg-hover`      | `#eef2f9` | Interactive hover & neutral pill fill         |
| `--sh-border`        | `#e2e8f0` | Crisp card & table dividers                   |
| `--sh-border-strong` | `#cbd5e1` | Emphasized controls, inputs, `<kbd>` borders  |
| `--sh-ink`           | `#0f172a` | Primary slate-900 ink for headings & prose    |
| `--sh-ink-secondary` | `#475569` | Subtitles, metadata, labels                   |
| `--sh-ink-muted`     | `#64748b` | Captions & locked hints                       |
| `--sh-primary`       | `#2563eb` | Electric Cobalt primary action accent         |
| `--sh-primary-hover` | `#1d4ed8` | Hover state on Cobalt primary CTAs            |
| `--sh-primary-fg`    | `#ffffff` | High-contrast foreground on primary CTAs      |
| `--sh-primary-soft`  | `#eff6ff` | Tinted Cobalt surface for `.btn-info` / zones |
| `--sh-cyan`          | `#0891b2` | Companion cyan for XP & progress gradients    |
| `--sh-success`       | `#059669` | Solved / AC / Mastered state                  |
| `--sh-warning`       | `#d97706` | Streak, Gold tier, and warning signals        |
| `--sh-danger`        | `#dc2626` | Errors & urgent deadline countdown            |

### Dark Mode — Obsidian IDE Studio (`data-bs-theme="dark"`)

| Token                | Value                      | Role                                    |
| -------------------- | -------------------------- | --------------------------------------- |
| `--sh-bg-canvas`     | `#0b101b`                  | Deep obsidian IDE canvas                |
| `--sh-bg-surface`    | `#121927`                  | Card, navbar, and panel surface         |
| `--sh-bg-subtle`     | `#182132`                  | Elevated subtle strips & input wells    |
| `--sh-bg-hover`      | `#1f2b40`                  | Interactive hover fill                  |
| `--sh-border`        | `#223047`                  | Hairline obsidian borders               |
| `--sh-border-strong` | `#324565`                  | Control borders, `<kbd>`, tracks        |
| `--sh-ink`           | `#f1f5f9`                  | Crisp high-legibility foreground        |
| `--sh-ink-secondary` | `#94a3b8`                  | Secondary labels & descriptions         |
| `--sh-ink-muted`     | `#64748b`                  | Muted timestamps & locked captions      |
| `--sh-primary`       | `#3b82f6`                  | Luminous Electric Cobalt accent         |
| `--sh-primary-hover` | `#60a5fa`                  | Brightened hover Cobalt                 |
| `--sh-primary-fg`    | `#ffffff`                  | Guaranteed `#FFFFFF` CTA text           |
| `--sh-primary-soft`  | `rgba(59, 130, 246, 0.15)` | Translucent Cobalt surface              |
| `--sh-cyan`          | `#22d3ee`                  | Companion cyan accent                   |
| `--sh-success`       | `#34d399`                  | Luminous emerald for AC & mastery       |
| `--sh-warning`       | `#fbbf24`                  | Warm amber for Streak, Sun toggle, Gold |
| `--sh-danger`        | `#f87171`                  | Soft coral red for errors/urgent alerts |

---

## Shared Component Primitives (`.sh-*`)

- `.sh-navbar` — Sticky 58px frosted glass topbar (`backdrop-filter: blur(14px)`), Cobalt-to-Cyan `.sh-brand-mark`, `.sh-course-pill`, `.sh-pulse-pill` (live Level + XP progress + Streak), high-contrast `.sh-theme-toggle` (sun in dark, moon in light), and compact `.sh-role-pill`.
- `.sh-hero-header` — Directional Cobalt wash banner header on primary student pages.
- `.sh-q-topbar` — Horizontal question stepper ribbon directly above the question card (`HW0.1`..`HW0.6` status pills + `Alt + ← / →` shortcut hint).
- `.sh-question-table` / `.sh-zone-row` / `.sh-q-link` — Bordered zone section dividers with Cobalt start-border accent stripe and clean non-underlined titles.
- `.sh-attempt-pill` — Semantic status chips (`is-active`, `is-perfect`, `is-partial`) for submission variant history.
- `.sh-pre-inline` / `.sh-copy-btn-inline` — Inline icon-only clipboard copy triggers inside sample I/O table cells.
- `.sh-scorebar` / `.sh-progress-brand` / `.sh-progress-success` — Rounded progress tracks with gradient fills and `tabular-nums` clarity even at `0%`.
- `.sh-mobile-nav` — Fixed bottom tab bar below `768px` (outside `Exam` / LockDown Browser) with safe-area bottom inset and `44px+` touch targets.
