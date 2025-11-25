# Lighthouse Audit Reports

This directory contains Lighthouse performance audit reports for the Sports Trivia platform.

## Directory Structure

```
lighthouse-reports/
  ├── localhost/
  │   └── {timestamp}/
  │       ├── home.html
  │       ├── home.json
  │       ├── quizzes.html
  │       ├── quizzes.json
  │       └── summary.json
  ├── production/
  │   └── {timestamp}/
  │       ├── home.html
  │       ├── home.json
  │       └── ...
  ├── analysis.json
  └── README.md
```

## Running Audits

### Localhost
```bash
npm run lighthouse:audit
```

### Production
```bash
npm run lighthouse:audit:prod
```

### Both Environments
```bash
npm run lighthouse:audit:all
```

## Analyzing Reports

After running audits, analyze the findings:

```bash
tsx scripts/analyze-lighthouse-reports.ts
```

This will generate `analysis.json` with aggregated insights and recommendations.

## Report Files

- **HTML Reports**: Visual reports that can be opened in a browser for detailed analysis
- **JSON Reports**: Machine-readable reports containing all audit data
- **summary.json**: Aggregated summary of all audits for a specific environment and timestamp
- **analysis.json**: Cross-environment analysis with common issues and opportunities

## Pages Audited

- `/` - Home page
- `/quizzes` - Quizzes listing
- `/topics` - Topics listing
- `/leaderboard` - Leaderboard
- `/search` - Search page
- `/random-quiz` - Random quiz
- `/challenges` - Challenges
- `/friends` - Friends
- `/notifications` - Notifications

## Understanding Scores

Lighthouse scores are on a scale of 0-100:

- **90-100**: Good (green)
- **50-89**: Needs improvement (orange)
- **0-49**: Poor (red)

## Categories

- **Performance**: Page load speed and runtime performance
- **Accessibility**: How accessible the page is to all users
- **Best Practices**: Adherence to web best practices
- **SEO**: Search engine optimization

