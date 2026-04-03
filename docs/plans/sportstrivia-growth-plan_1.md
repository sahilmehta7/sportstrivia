# Sportstrivia.in Growth Plan (Acquisition + Retention) — 30 Days

This plan assumes you already have:
- Daily quizzes (overall + Cricket/Football/Tennis/Basketball)
- A Topics directory at `/topics` and topic landing pages (e.g., `/topics/football`, `/topics/tennis`)

## North Star + Targets (track weekly)

**North Star metric:** Shares per completed quiz (SPCQ)

Recommended early targets:
- Quiz completion rate (starts → completes): **55–70%**
- SPCQ (shares/completes): **0.15+** (good), **0.30+** (great)
- Invite acceptance rate (opens/clicks from shares): **10–25%**
- D1 retention: **25%+**
- D7 retention: **10%+**

---

## Week-by-week roadmap

## Week 1 — Viral Loop + Conversion Polish (highest ROI)
Goal: make every completed quiz produce new entrants via WhatsApp + clean landing.

### 1.1 Results screen: “Challenge” loop (must-have)
**Add (or improve) these CTAs:**
- Primary: **Challenge on WhatsApp**
- Secondary: **Copy link**
- Optional: **Share image** (auto-generated scorecard)

**Share copy template (auto-filled):**
> I scored **{score}/{total}** on Sportstrivia’s **{quiz_title}** 🏆  
> Beat me: {challenge_link}

**Challenge link behavior (important):**
- Landing shows: “Beat {name}’s score: {score}/{total}”
- One-click **Start Quiz**
- After completion, show user’s score vs challenger (social proof)

**Tracking events:**
- `quiz_start`, `quiz_complete`
- `share_click_whatsapp`, `share_click_copy`
- `challenge_open`, `challenge_accept`, `challenge_complete`

### 1.2 Fix presentation gaps
- Ensure **every quiz card** has a cover image (no “No cover” tiles).
- Standardize quiz card metadata:
  - Title length, short description, difficulty badge, estimated time, #questions

### 1.3 Add “Play today’s Daily Quiz” CTA everywhere
On:
- Topic pages
- Quiz pages
- Home page modules

**Example component:**
- “Today’s Football Daily Quiz”
- CTA: “Play now”
- Secondary: “See past Football quizzes” (if available)

### 1.4 Reduce “empty shelf” friction on `/topics`
If topics show “0 packs / 0 datasets”:
- Either **hide empty topics** from the directory, or
- Mark them “Coming Soon” + add **Follow** button:
  - WhatsApp channel / email capture / push

**Quick win:** sort `/topics` by “most playable” first (topics with content).

**Deliverables by end of Week 1:**
- WhatsApp challenge loop live + event tracking
- Covers fixed
- Daily CTA placed on topic & quiz pages
- `/topics` reordered or empties de-emphasized

---

## Week 2 — SEO Foundations + Topic Hub Upgrades
Goal: turn Topics into Google landing pages that rank.

### 2.1 Create an SEO checklist (apply to every topic page)
**On-page:**
- H1: “Football Trivia & Quiz Questions”
- 250–400 words of non-fluffy intro (what you’ll get + difficulty + update cadence)
- FAQ section (3–6 questions)
- Internal links to:
  - Daily quiz for that sport
  - Top 3 related topics
  - 5 best quizzes in that topic

**Technical:**
- Indexable (no accidental noindex)
- Canonical URL set
- Clean slug strategy (no duplicates: “football” vs “soccer”)
- Fast load and SSR/SSG where possible
- Structured data where applicable (FAQ schema)

### 2.2 Canonicalize taxonomy duplication (critical)
Audit for duplicates like:
- Football vs Soccer
- Tennis vs Grand Slams vs ATP (overlaps)

Rules:
- Choose **one canonical per concept**.
- Redirect alternates to canonical.
- Add canonical tags to avoid split rankings.

### 2.3 Build 20 “money” topic hubs (prioritize search + share)
Pick topics with:
- High search demand
- High fan identity (“my club/team”)
- High shareability

Suggested priority set:
**Cricket**
- IPL, India, ODI World Cup, T20 World Cup, Test Cricket, Ashes, Ranji Trophy, Cricket Records
**Football**
- Premier League, UEFA Champions League, FIFA World Cup, La Liga, Manchester United, Liverpool, Arsenal, Barcelona, Real Madrid
**Tennis**
- Wimbledon, Roland-Garros, US Open, Australian Open, Big 3, Tennis Records
**Basketball**
- NBA, Lakers, Celtics, Bulls, NBA Finals, NBA Records

**Deliverables by end of Week 2:**
- SEO template implemented for topic pages
- Canonical + redirect plan applied to top duplicates
- 20 topic pages upgraded with intro + FAQ + internal links + proper meta

---

## Week 3 — Long-tail Content Engine (publish, don’t perfect)
Goal: ship lots of *rankable* quiz landing pages.

### 3.1 Create 30 long-tail quiz pages (fast, consistent)
Each should target an intent keyword like:
- “{Team} trivia quiz”
- “{Tournament} quiz”
- “Hardest {sport} trivia”
- “{era/player} quiz”

**Format standardization:**
- 10 questions (daily can vary, but these should be stable)
- Difficulty label
- Short hook description
- Clean URL: `/quiz/{slug}`

### 3.2 Topic clusters (hub → spokes)
For each big hub, create 5–10 supporting quizzes and link them:
Example: **Premier League Hub**
- Managers & Tactics
- Golden Boot seasons
- Derby folklore
- Record breakers
- One-season wonders
- “Who am I?” (players)

**Internal linking rules:**
- Every quiz page links back to its parent topic hub.
- Topic hub lists the best quizzes + “Newest” + “Hardest”.

### 3.3 Freshness without bloat
- Keep daily quizzes separate from evergreen quizzes.
- Add “Updated regularly” on evergreen pages (but don’t constantly rewrite).

**Deliverables by end of Week 3:**
- 30 new quiz landing pages published
- At least 5 clusters with hub-spoke linking implemented

---

## Week 4 — Distribution + Partnerships (turn content into traffic)
Goal: consistent social reach + community growth.

### 4.1 Instagram/TikTok content cadence (batch production)
**Weekly output:**
- 7 Reels (1/day)
- 3 Carousels
- 2 Stories/day (polls + quiz snippets)

**Reels formula:**
- Hook: “Can you get this in 5 seconds?”
- 3 rapid questions on-screen
- CTA: “Play the full quiz on Sportstrivia (link in bio)”

**Carousels formula (6 slides):**
1. Title: “Premier League Trivia”
2. Q1
3. Q2
4. Q3
5. “Score yourself”
6. CTA: “Full quiz → sportstrivia.in”

### 4.2 WhatsApp distribution
- Create a WhatsApp Channel: “Sportstrivia Daily”
- Daily post: 1-line hook + link to today’s quiz
- Weekly: “Beat the Producer” challenge leaderboard

### 4.3 Micro-partnership outreach (high conversion)
Target pages:
- Club fan pages
- Meme pages
- Fantasy sports groups
- College sports communities

**Offer:**
- “Custom quiz for your audience” + branded cover
- Their followers compete on a leaderboard page: `/leaderboard/{partner}`

**Outreach targets:**
- 50 DMs/week
- Aim for 5 collabs/week

**Deliverables by end of Week 4:**
- Social pipeline running weekly
- WhatsApp channel active
- 10+ partnership posts live (or scheduled)

---

## Feature Backlog (compounding growth)

### Must-build (in order)
1. **Challenge links + WhatsApp share** (Week 1)
2. **Streaks + badges** (if not already strong)
3. **User profiles & stats** (accuracy by sport, best categories)
4. **Leaderboards** (daily/weekly + topic-specific)

### Nice-to-have (after the above)
- User-generated quizzes (UGC)
- Creator profiles (credits + shareable page)
- Embedded quiz widget for bloggers

---

## Analytics Setup (minimal but sufficient)

### Tools
- Google Analytics 4
- Google Search Console

### Events to track
- `topic_view`
- `quiz_view`
- `quiz_start`
- `quiz_complete`
- `share_click_whatsapp`
- `share_click_copy`
- `challenge_open`
- `challenge_accept`
- `challenge_complete`
- `signup` / `login` (if present)
- `streak_increment` (if present)

### Weekly dashboard (one page)
- Traffic by channel (Google / Social / Direct)
- Top 10 landing pages
- Quiz completion rate
- SPCQ
- New vs returning users
- D1 / D7 retention (if you have user accounts)

---

## Checklists you can reuse

## A) Topic Page SEO Checklist
- [ ] Unique title + meta description
- [ ] H1 matches keyword (“Football Trivia & Quiz Questions”)
- [ ] Intro 250–400 words
- [ ] 3–6 FAQs
- [ ] Links to daily quiz
- [ ] Lists: Best, Newest, Hardest
- [ ] 5+ internal links to related topics/quizzes
- [ ] Canonical + clean slug
- [ ] Indexable + fast

## B) Quiz Page Conversion Checklist
- [ ] Clear CTA above fold (“Start Quiz”)
- [ ] Difficulty + duration visible
- [ ] “Challenge a friend” after completion
- [ ] Scorecard share image
- [ ] Related quizzes section
- [ ] Topic hub backlink

## C) Partnership Offer Template (DM)
> Hey! I run Sportstrivia — we make high-quality sports trivia quizzes.  
> I can create a **custom {team/league} quiz** for your page and a **leaderboard** so your followers compete.  
> Want me to send a sample quiz + cover?

---

## Suggested “First 10” SEO Pages (fast wins)
1. Premier League Trivia Quiz
2. UEFA Champions League Trivia Quiz
3. FIFA World Cup Trivia Quiz
4. Manchester United Trivia Quiz
5. Liverpool Trivia Quiz
6. IPL Trivia Quiz
7. India Cricket Trivia Quiz
8. Test Cricket Records Trivia Quiz
9. Wimbledon Trivia Quiz
10. NBA Finals Trivia Quiz

---

## What “done” looks like after 30 days
- Daily quizzes drive retention AND sharing
- Topics act as rankable SEO hubs
- 30+ long-tail quiz pages bring Google traffic
- WhatsApp share loop consistently brings new users
- Social + partnerships create predictable weekly spikes
