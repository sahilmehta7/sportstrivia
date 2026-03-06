import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, UserRole, ChallengeStatus } from '@prisma/client';
import { encode } from 'next-auth/jwt';

const BASE_URL = process.env.PLAY_BASE_URL || 'http://localhost:3200';
const OUTPUT_DIR = path.join(process.cwd(), 'assets/play-store/screenshots/phone');
const RAW_OUTPUT_DIR = path.join(OUTPUT_DIR, 'raw');
const MANIFEST_PATH = path.join(process.cwd(), 'docs/release/play-store/screenshot-manifest.v1.json');
const REPORT_PATH = path.join(process.cwd(), 'docs/release/play-store/screenshot-capture-report.json');

const CAPTURE_USER_EMAIL = process.env.PLAY_AUTH_USER_EMAIL || '';
const CAPTURE_USER_NAME = process.env.PLAY_AUTH_USER_NAME || 'Jordan Blake';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
const IS_PRODUCTION_AUTH = process.env.NODE_ENV === 'production';
const COOKIE_NAME = IS_PRODUCTION_AUTH
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

const prisma = new PrismaClient();

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function compileRoute(routeTemplate, data) {
  return routeTemplate.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing route token: ${key}`);
    }
    return String(value);
  });
}

async function gotoWithRetry(page, url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      return;
    } catch (error) {
      lastError = error;
      const isConnRefused = String(error?.message || '').includes('ERR_CONNECTION_REFUSED');
      if (!isConnRefused || i === attempts - 1) {
        throw error;
      }
      await page.waitForTimeout(1000 * (i + 1));
    }
  }
  throw lastError;
}

async function dismissOnboardingPrompt(page) {
  const maybeLater = page.locator('button', { hasText: 'Maybe later' }).first();
  if (await maybeLater.isVisible().catch(() => false)) {
    await maybeLater.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(300);
    return;
  }

  const closeByDialog = page.locator('div:has-text("Your Arena Awaits") button').first();
  if (await closeByDialog.isVisible().catch(() => false)) {
    await closeByDialog.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function removeNonProductOverlays(page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal,[data-nextjs-dev-tools-button]').forEach((el) => el.remove());
  });
}

async function getFocusRect(page, selector) {
  if (!selector) return null;
  const locator = page.locator(selector).first();
  const count = await locator.count();
  if (!count) return null;
  const visible = await locator.isVisible().catch(() => false);
  if (!visible) return null;
  const box = await locator.boundingBox().catch(() => null);
  if (!box) return null;
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
    top: Math.round(box.y),
    bottom: Math.round(box.y + box.height),
  };
}

async function scrollToSelector(page, selector, align = 'center') {
  const locator = page.locator(selector).first();
  const count = await locator.count();
  if (!count) return false;

  await locator.evaluate((el, position) => {
    const rect = el.getBoundingClientRect();
    const currentTop = window.scrollY + rect.top;
    const viewportHeight = window.innerHeight;

    let target = currentTop;
    if (position === 'start') {
      target = Math.max(currentTop - 96, 0);
    } else {
      target = Math.max(currentTop - (viewportHeight / 2) + (rect.height / 2), 0);
    }

    window.scrollTo({ top: target, behavior: 'instant' });
  }, align).catch(() => {});

  await page.waitForTimeout(350);
  return true;
}

async function adjustFocusIntoSafeArea(page, focusSelector, safeArea, viewportHeight) {
  if (!focusSelector) return null;

  let rect = await getFocusRect(page, focusSelector);
  if (!rect) return null;

  const safeTop = safeArea?.top ?? 0;
  const safeBottom = viewportHeight - (safeArea?.bottom ?? 0);

  if (rect.top >= safeTop && rect.bottom <= safeBottom) {
    return rect;
  }

  const locator = page.locator(focusSelector).first();
  await locator.evaluate((el, { safeTopPx, safeBottomPx }) => {
    const rect = el.getBoundingClientRect();
    if (!rect) return;
    const focusCenter = window.scrollY + rect.top + rect.height / 2;
    const safeCenter = (safeTopPx + safeBottomPx) / 2;
    const target = Math.max(Math.round(focusCenter - safeCenter), 0);
    window.scrollTo({ top: target, behavior: 'instant' });
  }, {
    safeTopPx: safeTop,
    safeBottomPx: safeBottom,
  }).catch(() => {});

  await page.waitForTimeout(350);
  rect = await getFocusRect(page, focusSelector);
  return rect;
}

async function executeAction(page, action) {
  const type = action?.type;

  if (type === 'wait') {
    await page.waitForTimeout(action.ms ?? 400);
    return;
  }

  if (type === 'dismissOnboarding') {
    await dismissOnboardingPrompt(page);
    return;
  }

  if (type === 'click') {
    const locator = page.locator(action.selector).first();
    await locator.waitFor({ state: 'visible', timeout: action.timeoutMs ?? 10000 });
    await locator.click({ timeout: action.timeoutMs ?? 10000 });
    await page.waitForTimeout(action.afterMs ?? 400);
    return;
  }

  if (type === 'clickOptional') {
    const locator = page.locator(action.selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (visible) {
      await locator.click({ timeout: action.timeoutMs ?? 6000 }).catch(() => {});
      await page.waitForTimeout(action.afterMs ?? 300);
    }
    return;
  }

  if (type === 'waitForSelector') {
    await page.waitForSelector(action.selector, { timeout: action.timeoutMs ?? 10000 });
    return;
  }

  if (type === 'goto') {
    if (!action.route) {
      throw new Error('goto action requires route');
    }
    await gotoWithRetry(page, action.route.startsWith('http') ? action.route : `${BASE_URL}${action.route}`);
    return;
  }

  if (type === 'gotoIfMissing') {
    const locator = page.locator(action.selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) {
      if (!action.route) {
        throw new Error('gotoIfMissing action requires route');
      }
      await gotoWithRetry(page, action.route.startsWith('http') ? action.route : `${BASE_URL}${action.route}`);
      await page.waitForTimeout(action.afterMs ?? 400);
    }
    return;
  }

  throw new Error(`Unsupported action type: ${type}`);
}

async function applyAuthSession(context, user) {
  if (!user) return;

  if (!AUTH_SECRET) {
    throw new Error('AUTH_SECRET or NEXTAUTH_SECRET is required for authenticated capture.');
  }

  const jwt = await encode({
    secret: AUTH_SECRET,
    salt: COOKIE_NAME,
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    maxAge: 30 * 24 * 60 * 60,
  });

  // Use an explicit Cookie header for all requests instead of browser cookie storage.
  // This avoids localhost-specific Playwright cookie validation issues while still
  // authenticating SSR/App Router requests.
  await context.setExtraHTTPHeaders({
    Cookie: [
      `${COOKIE_NAME}=${jwt}`,
      ...(COOKIE_NAME === '__Secure-next-auth.session-token'
        ? [`next-auth.session-token=${jwt}`]
        : []),
    ].join('; '),
  });
}

async function seedCaptureData() {
  if (!CAPTURE_USER_EMAIL) {
    throw new Error('PLAY_AUTH_USER_EMAIL is required for authenticated screenshot capture.');
  }

  const captureUser = await prisma.user.upsert({
    where: { email: CAPTURE_USER_EMAIL },
    update: {
      name: CAPTURE_USER_NAME,
      role: UserRole.USER,
      emailVerified: new Date(),
      bio: 'Competitive sports trivia player and challenge strategist.',
      favoriteTeams: ['Golden State Warriors', 'Real Madrid'],
      totalPoints: 6840,
      currentStreak: 6,
      longestStreak: 14,
      lastActiveDate: new Date(),
    },
    create: {
      email: CAPTURE_USER_EMAIL,
      name: CAPTURE_USER_NAME,
      role: UserRole.USER,
      emailVerified: new Date(),
      bio: 'Competitive sports trivia player and challenge strategist.',
      favoriteTeams: ['Golden State Warriors', 'Real Madrid'],
      totalPoints: 6840,
      currentStreak: 6,
      longestStreak: 14,
      lastActiveDate: new Date(),
    },
  });

  const opponentSeeds = [
    { email: 'play-opponent-1@example.com', name: 'Maya Carter', points: 9120 },
    { email: 'play-opponent-2@example.com', name: 'Noah Silva', points: 8410 },
    { email: 'play-opponent-3@example.com', name: 'Leo Kim', points: 7770 },
    { email: 'play-opponent-4@example.com', name: 'Ava Ortiz', points: 7350 },
  ];

  const opponents = [];
  for (const item of opponentSeeds) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        role: UserRole.USER,
        emailVerified: new Date(),
        totalPoints: item.points,
        currentStreak: 4,
        longestStreak: 9,
      },
      create: {
        email: item.email,
        name: item.name,
        role: UserRole.USER,
        emailVerified: new Date(),
        totalPoints: item.points,
        currentStreak: 4,
        longestStreak: 9,
      },
    });
    opponents.push(user);
  }

  const quiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      status: 'PUBLISHED',
      playMode: 'STANDARD',
      maxAttemptsPerUser: null,
      questionPool: { some: {} },
    },
    include: {
      topicConfigs: {
        select: { topicId: true },
        take: 1,
      },
      questionPool: {
        select: { questionId: true },
        orderBy: { order: 'asc' },
        take: 10,
      },
    },
  });

  if (!quiz) {
    throw new Error('No published standard quiz with questions found for screenshot capture.');
  }

  const selectedQuestionIds = quiz.questionPool.map((q) => q.questionId);
  const totalQuestions = selectedQuestionIds.length;
  const correctAnswers = Math.max(1, Math.floor(totalQuestions * 0.7));

  // Create deterministic global leaderboard context by adding recent attempts for capture + opponents.
  const leaderboardActors = [captureUser, ...opponents];
  for (const actor of leaderboardActors) {
    await prisma.quizAttempt.deleteMany({
      where: {
        userId: actor.id,
        quizId: quiz.id,
        completedAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    });
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: captureUser.id,
      quizId: quiz.id,
      selectedQuestionIds,
      score: 78,
      totalQuestions,
      correctAnswers,
      passed: true,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 118 * 60 * 1000),
      averageResponseTime: 8,
      longestStreak: Math.max(2, Math.floor(correctAnswers / 2)),
      totalPoints: 240,
      totalTimeSpent: 220,
    },
  });

  const leaderboardAttemptData = [
    { user: opponents[0], score: 96, points: 380, minutesAgo: 30 },
    { user: opponents[1], score: 89, points: 330, minutesAgo: 42 },
    { user: captureUser, score: 84, points: 295, minutesAgo: 55 },
    { user: opponents[2], score: 81, points: 260, minutesAgo: 68 },
    { user: opponents[3], score: 78, points: 240, minutesAgo: 85 },
  ];

  for (const item of leaderboardAttemptData) {
    const completedAt = new Date(Date.now() - item.minutesAgo * 60 * 1000);
    await prisma.quizAttempt.create({
      data: {
        userId: item.user.id,
        quizId: quiz.id,
        selectedQuestionIds,
        score: item.score,
        totalQuestions,
        correctAnswers: Math.max(1, Math.floor((item.score / 100) * totalQuestions)),
        passed: true,
        startedAt: new Date(completedAt.getTime() - 5 * 60 * 1000),
        completedAt,
        averageResponseTime: 7,
        longestStreak: 4,
        totalPoints: item.points,
        totalTimeSpent: 210,
      },
    });
  }

  await prisma.quizLeaderboard.deleteMany({
    where: { quizId: quiz.id, userId: { in: leaderboardActors.map((u) => u.id) } },
  });

  for (const [idx, item] of leaderboardAttemptData.entries()) {
    await prisma.quizLeaderboard.create({
      data: {
        quizId: quiz.id,
        userId: item.user.id,
        bestScore: item.score,
        bestTime: 210 + idx * 8,
        attempts: 1,
        rank: idx + 1,
        bestPoints: item.points,
        averageResponseTime: 7 + idx,
      },
    });
  }

  if (quiz.topicConfigs[0]?.topicId) {
    await prisma.userTopicStats.upsert({
      where: { userId_topicId: { userId: captureUser.id, topicId: quiz.topicConfigs[0].topicId } },
      update: {
        questionsAnswered: 58,
        questionsCorrect: 46,
        successRate: 79.3,
        averageTime: 7.6,
        currentStreak: 6,
        lastAnsweredAt: new Date(),
      },
      create: {
        userId: captureUser.id,
        topicId: quiz.topicConfigs[0].topicId,
        questionsAnswered: 58,
        questionsCorrect: 46,
        successRate: 79.3,
        averageTime: 7.6,
        currentStreak: 6,
        lastAnsweredAt: new Date(),
      },
    });
  }

  const badges = await prisma.badge.findMany({ orderBy: [{ rarity: 'asc' }, { order: 'asc' }], take: 3 });
  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: captureUser.id, badgeId: badge.id } },
      update: { earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      create: { userId: captureUser.id, badgeId: badge.id, earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    });
  }

  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const primaryOpponent = opponents[0];

  await prisma.challenge.upsert({
    where: { id: `active-${captureUser.id.slice(-12)}-${quiz.id.slice(-12)}` },
    update: {
      status: ChallengeStatus.ACCEPTED,
      expiresAt: future,
      challengerScore: 74,
      challengedScore: 68,
    },
    create: {
      id: `active-${captureUser.id.slice(-12)}-${quiz.id.slice(-12)}`,
      challengerId: captureUser.id,
      challengedId: primaryOpponent.id,
      quizId: quiz.id,
      status: ChallengeStatus.ACCEPTED,
      expiresAt: future,
      challengerScore: 74,
      challengedScore: 68,
    },
  });

  await prisma.challenge.upsert({
    where: { id: `pending-${primaryOpponent.id.slice(-12)}-${quiz.id.slice(-12)}` },
    update: {
      status: ChallengeStatus.PENDING,
      expiresAt: future,
      challengerScore: null,
      challengedScore: null,
    },
    create: {
      id: `pending-${primaryOpponent.id.slice(-12)}-${quiz.id.slice(-12)}`,
      challengerId: primaryOpponent.id,
      challengedId: captureUser.id,
      quizId: quiz.id,
      status: ChallengeStatus.PENDING,
      expiresAt: future,
    },
  });

  await prisma.notification.deleteMany({ where: { userId: captureUser.id } });

  const notificationPayloads = [
    {
      minutesAgo: 12,
      type: 'CHALLENGE_RECEIVED',
      content: JSON.stringify({
        title: 'New Challenge Received',
        body: `${primaryOpponent.name} challenged you in ${quiz.title}`,
        challengeId: `pending-${primaryOpponent.id.slice(-12)}-${quiz.id.slice(-12)}`,
      }),
    },
    {
      minutesAgo: 35,
      type: 'BADGE_EARNED',
      content: JSON.stringify({ title: 'Badge Unlocked', body: 'You earned the Quick Draw badge.' }),
    },
    {
      minutesAgo: 58,
      type: 'FRIEND_REQUEST',
      content: JSON.stringify({ title: 'New Friend Request', body: `${opponents[1].name} sent a friend request.` }),
    },
    {
      minutesAgo: 80,
      type: 'CHALLENGE_ACCEPTED',
      content: JSON.stringify({ title: 'Challenge Accepted', body: `${opponents[2].name} accepted your challenge.` }),
    },
  ];

  for (const payload of notificationPayloads) {
    await prisma.notification.create({
      data: {
        userId: captureUser.id,
        type: payload.type,
        content: payload.content,
        read: false,
        createdAt: new Date(Date.now() - payload.minutesAgo * 60 * 1000),
      },
    });
  }

  const randomQuiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      status: 'PUBLISHED',
      playMode: 'STANDARD',
      maxAttemptsPerUser: 1,
      questionPool: { some: {} },
      attempts: {
        none: {
          userId: captureUser.id,
          completedAt: { not: null },
        },
      },
    },
    select: { slug: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    user: captureUser,
    quizSlug: quiz.slug,
    resultsAttemptId: attempt.id,
    randomQuizSlug: randomQuiz?.slug ?? quiz.slug,
  };
}

async function run() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright is not installed. Install with `npm i -D playwright` before running this script.');
    process.exit(1);
  }

  await ensureDir(OUTPUT_DIR);
  await ensureDir(RAW_OUTPUT_DIR);

  const manifest = await readJson(MANIFEST_PATH);
  const dynamic = await seedCaptureData();

  const browser = await chromium.launch({ headless: true });
  const report = {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    manifest: path.relative(process.cwd(), MANIFEST_PATH),
    shots: [],
  };

  try {
    const context = await browser.newContext({
      viewport: manifest.capture.viewport,
      deviceScaleFactor: manifest.capture.deviceScaleFactor,
      isMobile: manifest.capture.isMobile,
      hasTouch: manifest.capture.hasTouch,
      userAgent: manifest.capture.userAgent,
    });

    await applyAuthSession(context, dynamic.user);

    const page = await context.newPage();
    const viewportHeight = manifest.capture.viewport.height;

    for (const shot of manifest.shots) {
      const shotReport = {
        name: shot.name,
        route: shot.route,
        url: null,
        success: false,
        focusSelector: shot.focusSelector || null,
        focusFound: false,
        focusRect: null,
        safeArea: manifest.capture.safeArea,
        issues: [],
      };

      try {
        const route = compileRoute(shot.route, dynamic);
        const url = `${BASE_URL}${route}`;
        shotReport.url = url;

        await gotoWithRetry(page, url);

        if (shot.waitFor) {
          await page.waitForSelector(shot.waitFor, { timeout: 20000 });
        }

        await dismissOnboardingPrompt(page);
        await removeNonProductOverlays(page);

        for (const action of shot.actions ?? []) {
          const resolvedAction = action.route
            ? { ...action, route: compileRoute(action.route, dynamic) }
            : action;
          await executeAction(page, resolvedAction);
        }

        if (shot.scrollStrategy?.type === 'selector' && shot.scrollStrategy.selector) {
          const ok = await scrollToSelector(page, shot.scrollStrategy.selector, shot.scrollStrategy.align || 'center');
          if (!ok && Number.isFinite(shot.fallbackScrollY)) {
            await page.evaluate((y) => window.scrollTo(0, y), shot.fallbackScrollY);
          }
        } else if (shot.scrollStrategy?.type === 'y' && Number.isFinite(shot.scrollStrategy.value)) {
          await page.evaluate((y) => window.scrollTo(0, y), shot.scrollStrategy.value);
        }

        await page.waitForTimeout(350);
        await dismissOnboardingPrompt(page);
        await removeNonProductOverlays(page);

        let focusRect = await getFocusRect(page, shot.focusSelector);
        if (!focusRect) {
          shotReport.issues.push('focus_selector_not_found');
        }

        focusRect = await adjustFocusIntoSafeArea(
          page,
          shot.focusSelector,
          manifest.capture.safeArea,
          viewportHeight
        );

        if (focusRect) {
          shotReport.focusFound = true;
          shotReport.focusRect = focusRect;

          const safeTop = manifest.capture.safeArea.top;
          const safeBottom = viewportHeight - manifest.capture.safeArea.bottom;
          if (focusRect.top < safeTop || focusRect.bottom > safeBottom) {
            shotReport.issues.push('focus_outside_safe_area');
          }
        }

        const rawTarget = path.join(RAW_OUTPUT_DIR, shot.name);
        await page.screenshot({ path: rawTarget, type: 'png', fullPage: false });

        shotReport.success = true;
        report.shots.push(shotReport);
        console.log(`Captured raw ${shot.name} from ${url}`);
      } catch (error) {
        shotReport.issues.push(`capture_error:${error.message}`);
        report.shots.push(shotReport);
        console.error(`Failed ${shot.name}:`, error.message);
      }
    }

    await context.close();
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  const failed = report.shots.filter((s) => !s.success);
  if (failed.length > 0) {
    console.error(`Capture completed with ${failed.length} failed shot(s).`);
    process.exit(1);
  }

  console.log(`Capture report written: ${REPORT_PATH}`);
  console.log(`Raw screenshots complete: ${RAW_OUTPUT_DIR}`);
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
