import { describe, expect, it } from 'vitest';

import { DAILY_PULSE_PUZZLES, getTodayPulsePuzzle } from './student-daily-pulse.js';
import { buildJalaliHeatmapWeeks, computeStreakWithFreezes } from './student-engagement.js';
import {
  type CanonicalGamificationSignals,
  type StudentAchievement,
  buildAchievements,
  computeCanonicalGamificationState,
  computeNextUnlockHint,
  computeWeeklyLeagues,
  computeWeeklyQuestsFromSignals,
  selectShowcaseBadges,
} from './student-gamification.js';
import { parseAndValidateAvatarDataUrl } from './student-profile.js';
import { getUserAvatarUrl, sanitizePublicProfileInput } from './student-profile.shared.js';

describe('computeStreakWithFreezes', () => {
  it('bridges a 1-day gap automatically without inflating streak length', () => {
    const res = computeStreakWithFreezes({
      activeDayKeys: ['2026-10-10', '2026-10-11', '2026-10-13', '2026-10-14'],
      todayKey: '2026-10-14',
      maxFreezesPerMonth: 2,
    });

    expect(res.currentStreakDays).toBe(4);
    expect(res.longestStreakDays).toBe(4);
    expect(res.frozenDayKeys).toEqual(['2026-10-12']);
    expect(res.freezesUsedThisMonth).toBe(1);
    expect(res.freezesRemainingThisMonth).toBe(1);
  });

  it('resets streak across a 2-day gap without wasting freezes', () => {
    const res = computeStreakWithFreezes({
      activeDayKeys: ['2026-10-10', '2026-10-11', '2026-10-14'],
      todayKey: '2026-10-14',
      maxFreezesPerMonth: 2,
    });

    expect(res.currentStreakDays).toBe(1);
    expect(res.longestStreakDays).toBe(2);
    expect(res.frozenDayKeys).toEqual([]);
    expect(res.freezesUsedThisMonth).toBe(0);
    expect(res.freezesRemainingThisMonth).toBe(2);
  });

  it('enforces the 2-per-Jalali-month quota across repeated gaps in the same month', () => {
    // 2026-09-25..2026-10-20 all fall within Mehr 1405
    const res = computeStreakWithFreezes({
      activeDayKeys: ['2026-09-26', '2026-09-28', '2026-09-30', '2026-10-02'],
      todayKey: '2026-10-02',
      maxFreezesPerMonth: 2,
    });

    expect(res.frozenDayKeys).toEqual(['2026-09-27', '2026-09-29']);
    expect(res.freezesUsedThisMonth).toBe(2);
    expect(res.freezesRemainingThisMonth).toBe(0);
    // 2026-10-01 could not be frozen, so streak reset before 2026-10-02
    expect(res.currentStreakDays).toBe(1);
    expect(res.longestStreakDays).toBe(3);
  });

  it('preserves active streak via tentative freeze when only yesterday was missed', () => {
    const res = computeStreakWithFreezes({
      activeDayKeys: ['2026-10-10', '2026-10-11'],
      todayKey: '2026-10-13',
      maxFreezesPerMonth: 2,
    });

    expect(res.frozenDayKeys).toEqual(['2026-10-12']);
    expect(res.currentStreakDays).toBe(2);
    expect(res.freezesRemainingThisMonth).toBe(1);
  });
});

describe('computeNextUnlockHint', () => {
  it('picks the closest unearned tiered medal and skips surgical-accuracy below 15 submissions', () => {
    const achievements = buildAchievements({
      oneshotCount: 4, // 4 of 5 -> 75% to Silver One-Shot (+100 XP)
      longestStreakDays: 3,
      perfectHwCount: 0,
      edgeHunterCount: 0,
      earlyBirdCount: 0,
      masteredTopicsCount: 0,
      syntaxCleanMaxRun: 0,
      bonusHunterCount: 0,
      acceptanceRate: 95,
      totalSubmissions: 6,
      firstBloodCount: 0,
      nightOwlCount: 0,
      buzzerBeaterCount: 0,
      dawnCoderCount: 0,
      comebackCount: 0,
      giantSlayerCount: 0,
      weekendWarriorWeeks: 0,
      taKudosCount: 0,
      coopCompletedCount: 0,
    });

    const hint = computeNextUnlockHint(achievements, 6);
    expect(hint).not.toBeNull();
    expect(hint?.achievementId).toBe('one-shot');
    expect(hint?.nextTier).toBe('silver');
    expect(hint?.remaining).toBe(1);
    expect(hint?.xpReward).toBe(100);
    expect(hint?.messageFa).toContain('نقره‌ای');
    expect(hint?.messageFa).toContain('One-Shot');
    expect(hint?.messageFa.match(/One-Shot/g)).toHaveLength(1);
    expect(hint?.messageFa).not.toContain('سوال One-Shot');
  });
});

describe('computeWeeklyQuestsFromSignals', () => {
  it('rotates across 4 weekly archetypes including Challenge Breaker and Comeback Kid', () => {
    const baseBounds = {
      weekLabel: 'هفته تست',
      weekEndsAtIso: '2026-12-04T20:29:59.000Z',
    };
    const commonSignals = {
      activeDaysWeek: 3,
      solvedQuestionsWeek: 4,
      cleanSolvesWeek: 2,
      oneshotWeek: 1,
      comebackWeek: 1,
      hardSolvedWeek: 1,
    };

    const w0 = computeWeeklyQuestsFromSignals({
      signals: commonSignals,
      bounds: { ...baseBounds, weekNumber: 4 },
    });
    const w1 = computeWeeklyQuestsFromSignals({
      signals: commonSignals,
      bounds: { ...baseBounds, weekNumber: 5 },
    });
    const w2 = computeWeeklyQuestsFromSignals({
      signals: commonSignals,
      bounds: { ...baseBounds, weekNumber: 6 },
    });
    const w3 = computeWeeklyQuestsFromSignals({
      signals: commonSignals,
      bounds: { ...baseBounds, weekNumber: 7 },
    });

    expect(w0.quests.map((q) => q.title)).toEqual([
      'Weekly Consistency',
      'Clean Solver',
      'Problem Sprinter',
    ]);
    expect(w1.quests.map((q) => q.title)).toEqual([
      'Weekly Consistency',
      'One-Shot Sprint',
      'Challenge Breaker',
    ]);
    expect(w2.quests.map((q) => q.title)).toEqual([
      'Weekly Consistency',
      'Comeback Kid',
      'Problem Sprinter',
    ]);
    expect(w3.quests.map((q) => q.title)).toEqual([
      'Weekly Consistency',
      'Clean Solver',
      'Challenge Breaker',
    ]);
    expect(w1.completedCount).toBe(3);
    expect(w2.completedCount).toBe(3);
  });
});

describe('computeCanonicalGamificationState & computeWeeklyLeagues', () => {
  it('produces identical Level/XP/Achievements for identical signal inputs and awards Phase 3 medals', () => {
    const signals: CanonicalGamificationSignals = {
      solvedAqIds: ['1', '2'],
      oneshotAqIds: ['1'],
      partialScoreSum: 0,
      oneshotCount: 1,
      edgeHunterCount: 0,
      comebackCount: 1,
      perfectHwCount: 0,
      earlyBirdCount: 0,
      bonusHunterCount: 1,
      syntaxCleanMaxRun: 6,
      totalSubmissions: 8,
      acceptedSubmissions: 6,
      activeDaysTotal: 3,
      activeDayKeys: ['2026-10-10', '2026-10-12', '2026-10-13'],
      nightOwlCount: 0,
      dawnCoderCount: 0,
      buzzerBeaterCount: 0,
      weekendWarriorWeeks: 0,
      masteredTopicsCount: 0,
      taKudosCount: 1,
      dailyPulseCorrectCount: 2,
      weeklyGoalMetWeeks: 1,
      weeklyGoalXp: 50,
      coopCompletedCount: 1,
      firstBloodAqIds: ['1'],
      activeDaysWeek: 3,
      solvedAqIdsWeek: ['1', '2'],
      cleanSolvesWeek: 2,
      oneshotWeek: 1,
      comebackWeek: 1,
      dailyPulseCorrectWeek: 2,
      taKudosWeek: 1,
    };

    const aqMeta = new Map([
      [
        '1',
        { solveRatePerc: 30, attempted: 10, firstBloodUserId: '42', firstBloodDisplayName: 'Test' },
      ],
      [
        '2',
        { solveRatePerc: 60, attempted: 10, firstBloodUserId: null, firstBloodDisplayName: null },
      ],
    ]);

    const bounds = {
      weekNumber: 5,
      weekLabel: 'هفته ۵',
      weekEndsAtIso: '2026-10-16T20:29:59.000Z',
      todayKey: '2026-10-13',
    };

    const stateA = computeCanonicalGamificationState({ signals, aqMeta, bounds });
    const stateB = computeCanonicalGamificationState({ signals, aqMeta, bounds });

    expect(stateA.totalXp).toBe(stateB.totalXp);
    expect(stateA.level.level).toBe(stateB.level.level);
    expect(stateA.unlockedAchievementIds).toEqual(stateB.unlockedAchievementIds);
    expect(stateA.unlockedAchievementIds).toEqual(
      expect.arrayContaining([
        'syntax-clean',
        'bonus-hunter',
        'ta-kudos',
        'class-coop',
        'first-blood',
        'comeback',
        'streak',
      ]),
    );
    expect(stateA.weeklyXp).toBeGreaterThan(0);
  });

  it('partitions students into balanced weekly leagues with valid promotion and relegation zones', () => {
    const members = Array.from({ length: 15 }, (_, idx) => ({
      userId: String(idx + 1),
      displayName: `Student ${idx + 1}`,
      totalXp: 500 - idx * 20,
      weeklyXp: idx < 10 ? 300 - idx * 20 : 0,
      solvedThisWeek: idx < 10 ? 2 : 0,
      level: 3,
      showcaseBadges: [],
    }));

    const bundle = computeWeeklyLeagues(members, {
      weekLabel: 'هفته ۵',
      weekEndsAtIso: '2026-10-16T20:29:59.000Z',
    });

    expect(bundle.leagues).toHaveLength(1);
    const league = bundle.leagues[0];
    expect(league.promoteCount).toBe(5);
    expect(league.relegateCount).toBe(5);
    expect(league.members.every((m) => m.zone !== 'promote' || m.weeklyXp > 0)).toBe(true);
  });
});

describe('Daily Python Pulse puzzle bank', () => {
  it('has 32 unique valid puzzles and selects one deterministically by Jalali day', () => {
    expect(DAILY_PULSE_PUZZLES.length).toBe(32);
    const ids = new Set(DAILY_PULSE_PUZZLES.map((p) => p.id));
    expect(ids.size).toBe(32);

    for (const p of DAILY_PULSE_PUZZLES) {
      expect(p.options).toHaveLength(4);
      expect(p.correctIndex).toBeGreaterThanOrEqual(0);
      expect(p.correctIndex).toBeLessThanOrEqual(3);
      expect(p.codeSnippet.length).toBeGreaterThan(0);
    }

    const first = getTodayPulsePuzzle('Asia/Tehran');
    const second = getTodayPulsePuzzle('Asia/Tehran');
    expect(first.puzzle.id).toBe(second.puzzle.id);
    expect(first.jalaliDayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('Public profile studio helpers', () => {
  it('sanitizes profile inputs, normalizes GitHub usernames, and caps pinned badges without aliases or privacy flags', () => {
    const clean = sanitizePublicProfileInput({
      display_alias: 'Ignored Alias',
      avatar_preset: 'rocket',
      avatar_color: 'violet',
      avatar_version: '1795734900000',
      banner_theme: 'aurora',
      bio: `   ${'B'.repeat(200)}   `,
      status_emoji: 'coding',
      favorite_topic: '  حلقه و لیست  ',
      github_username: 'https://github.com/@torvalds/',
      featured_title: 'Pythonista',
      pinned_badge_ids: 'streak, syntax-clean, streak, bonus-hunter, first-blood',
    });

    expect('displayAlias' in clean).toBe(false);
    expect('showOnLeaderboard' in clean).toBe(false);
    expect(clean.avatarPreset).toBe('rocket');
    expect(clean.avatarColor).toBe('violet');
    expect(clean.avatarVersion).toBe('1795734900000');
    expect(clean.bannerTheme).toBe('aurora');
    expect(clean.bio).toBe('B'.repeat(160));
    expect(clean.statusEmoji).toBe('coding');
    expect(clean.favoriteTopic).toBe('حلقه و لیست');
    expect(clean.githubUsername).toBe('torvalds');
    expect(clean.featuredTitle).toBe('Pythonista');
    expect(clean.pinnedBadgeIds).toEqual(['streak', 'syntax-clean', 'bonus-hunter']);

    const fallback = sanitizePublicProfileInput({
      avatar_preset: 'evil-preset',
      avatar_color: 'neon-pink',
      avatar_version: '../bad',
      banner_theme: 'unknown',
      status_emoji: 'invalid',
      github_username: 'invalid username!!',
      featured_title: 'Admin Override',
    });

    expect(fallback.avatarPreset).toBe('initials');
    expect(fallback.avatarColor).toBe('cobalt');
    expect(fallback.avatarVersion).toBeNull();
    expect(fallback.bannerTheme).toBe('nova');
    expect(fallback.statusEmoji).toBe('none');
    expect(fallback.githubUsername).toBeNull();
    expect(fallback.featuredTitle).toBe('auto');
  });

  it('builds safe cache-busted user avatar URLs only when version exists', () => {
    expect(getUserAvatarUrl('42', null)).toBeNull();
    expect(getUserAvatarUrl('42', '123456')).toBe('/pl/user_avatar/42?v=123456');
  });

  it('validates real image magic bytes for avatar data URLs and rejects spoofs or oversized payloads', () => {
    const validPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(80, 1),
    ]);
    const pngRes = parseAndValidateAvatarDataUrl(
      `data:image/png;base64,${validPng.toString('base64')}`,
    );
    expect(pngRes.mimeType).toBe('image/png');
    expect(pngRes.buffer.length).toBe(validPng.length);

    const validJpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(80, 2)]);
    const jpegRes = parseAndValidateAvatarDataUrl(
      `data:image/jpeg;base64,${validJpeg.toString('base64')}`,
    );
    expect(jpegRes.mimeType).toBe('image/jpeg');

    const validWebp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4, 0),
      Buffer.from('WEBP'),
      Buffer.alloc(80, 3),
    ]);
    const webpRes = parseAndValidateAvatarDataUrl(
      `data:image/webp;base64,${validWebp.toString('base64')}`,
    );
    expect(webpRes.mimeType).toBe('image/webp');

    const svgSpoof = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    expect(() =>
      parseAndValidateAvatarDataUrl(`data:image/png;base64,${svgSpoof.toString('base64')}`),
    ).toThrow();
    expect(() =>
      parseAndValidateAvatarDataUrl(`data:image/svg+xml;base64,${svgSpoof.toString('base64')}`),
    ).toThrow();

    const oversizedPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(260 * 1024, 1),
    ]);
    expect(() =>
      parseAndValidateAvatarDataUrl(`data:image/png;base64,${oversizedPng.toString('base64')}`),
    ).toThrow();
  });

  it('selects pinned earned badges first and backfills up to 3 earned badges', () => {
    const makeAch = (id: string, earned: boolean, rarityWeight: number): StudentAchievement => ({
      id,
      title: id,
      description: id,
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-award-fill',
      tier: earned ? 'gold' : 'locked',
      earned,
      currentValue: earned ? 5 : 0,
      nextTarget: earned ? null : 5,
      tierTargets: [1, 3, 5, 10],
      progressPerc: earned ? 100 : 0,
      progressText: '1',
      xpReward: 100,
      rarityWeight,
    });

    const achievements: StudentAchievement[] = [
      makeAch('streak', true, 10),
      makeAch('first-blood', true, 50),
      makeAch('ta-kudos', false, 100),
      makeAch('syntax-clean', true, 20),
      makeAch('bonus-hunter', true, 30),
    ];

    const selected = selectShowcaseBadges(achievements, ['ta-kudos', 'syntax-clean', 'streak']);
    expect(selected.map((b) => b.id)).toEqual(['syntax-clean', 'streak', 'first-blood']);
    expect(selected).toHaveLength(3);
  });
});

describe('buildJalaliHeatmapWeeks', () => {
  it('does not skip a full Jalali month when week 0 starts late in the preceding month', () => {
    const res = buildJalaliHeatmapWeeks({
      countsByDay: new Map(),
      frozenSet: new Set(),
      todayKey: '2026-11-27',
      numWeeks: 20,
    });

    const monthLabels = res.weeks.map((w) => w.monthLabel).filter((m) => m !== null);
    expect(monthLabels).toEqual(['مرداد', 'شهریور', 'مهر', 'آبان', 'آذر']);
  });
});
