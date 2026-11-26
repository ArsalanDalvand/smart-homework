# Smart-Homework — Product Definition & Guardrails

## Product Identity

**Smart-Homework** is a Persian-first (RTL), modern programming homework, mastery practice, and automated assessment platform built on top of **PrairieLearn**.
While its initial production deployment serves undergraduate Computer Science & Engineering courses (starting with Fundamentals of Programming at Iran University of Science and Technology — `IUST-BP`), the product identity, color system, and UX architecture are **university-agnostic** and designed to scale cleanly across Iranian universities and technical courses.

## Primary Users & Usage Context

- **Primary persona:** First- and second-year CS / engineering undergraduates practicing programming weekly, checking upcoming deadlines, debugging code in the browser or cloud VS Code, and tracking progress against peers.
- **Usage scenes:**
  1. **Desktop coding sessions (often late at night):** Switching seamlessly between the problem statement, submissions, and the dark cloud VS Code workspace (`workspace.css`) without eye-straining light/dark whiplash.
  2. **Quick mobile check-ins:** Checking deadlines, current standings on the homework leaderboard, streaks, and scores from a phone between classes.
  3. **High-stakes exams (`Exam` mode / LockDown Browser):** Focused, distraction-free mode where all non-exam gamification, leaderboards, and extra social chrome are strictly hidden.

## Tone, Language & Bilingual Terminology Policy

- **UX Copy Language:** Clear, natural, encouraging Persian (`lang="fa"`, `dir="rtl"`), written for beginners as well as advanced students. Active voice, concise labels, helpful error recovery, zero marketing hype or AI-sounding clichés.
- **Technical & Gamification Terms (Explicit Rule):** Do **not** force awkward literal Persian translations for established programming, CS, or gaming/achievement terms that developers and students naturally expect in English.
  - Keep titles/terms such as `First Blood`, `One-Shot`, `Early Bird`, `Edge Case Hunter`, `Night Owl`, `Buzzer Beater`, `Comeback`, `Giant Slayer`, `Perfectionist`, `Streak`, `XP`, `Level`, `Skill Tree`, `Rising Stars`, `Accuracy Kings`, and `Weekly Quests` in crisp English.
  - Keep **every description, subtitle, tooltip, progress explanation, empty state, and navigation label** in natural, beginner-friendly Persian so no student is ever blocked by English prose.
  - Always isolate standalone English terms inside RTL sentences using `dir="ltr"` + `unicode-bidi: isolate` (`.sh-en-term`) so numbers and punctuation never reorder.

## Architectural & Scope Constraints

1. **Student Surface Scope:** Visual and UX upgrades target **student-facing surfaces** (`html[data-surface="student"]`) and pure-student home pages. Instructor, TA, and Administrator workflows MUST retain their existing appearance and behavior without regressions.
2. **Production Docker Boundary (`Dockerfile.prod`):** Production builds copy `apps/prairielearn/src/`, `apps/prairielearn/public/`, `apps/prairielearn/elements/`, `templateCourse/`, and `scripts/entrypoint-prod.sh`, and compile pre-existing `assets/`. Therefore:
   - Do **not** add new npm packages.
   - Place new runtime stylesheets and lightweight client scripts under `apps/prairielearn/public/stylesheets/` and `apps/prairielearn/public/javascripts/`.
3. **Bootstrap 5.3 RTL + Hybrid Rendering:** Components must work harmoniously across both `@prairielearn/html` SSR templates and React 19 hydrated/server islands using Bootstrap 5.3 RTL CSS variables and shared `.sh-*` classes.
4. **Feature Flag Discipline (`FeatureManager`):** All optional student engagement and gamification capabilities remain gated behind `apps/prairielearn/src/lib/features/index.ts`, toggleable per institution/course/course instance, and automatically disabled in `Exam` mode.
5. **Public Repository Hygiene:** Never commit secrets, passwords, private join codes, or real student identifiers/data.
