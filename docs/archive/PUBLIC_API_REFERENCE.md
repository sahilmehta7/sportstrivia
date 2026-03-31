# Sports Trivia Public API Reference

This document outlines the public and player-facing endpoints for the Sports Trivia platform.

## 🔓 Public Endpoints
These endpoints are accessible without authentication.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quizzes` | List published quizzes with filtering, sorting, pagination |
| GET | `/api/quizzes/[slug]` | Fetch published quiz detail (metadata, counts, featured info) |
| GET | `/api/quizzes/[slug]/reviews` | Paginated reviews with sort and rating filters |
| GET | `/api/topics` | Hierarchical topic tree with quiz/question counts |
| GET | `/api/topics/top` | Trending topics snapshot |
| GET | `/api/leaderboards/global` | Global leaderboard (supports `period=daily|weekly|monthly|all-time`, `limit`) |
| GET | `/api/leaderboards/quiz/[id]` | Leaderboard for a single quiz |
| GET | `/api/leaderboards/topic/[id]` | Leaderboard filtered by topic |
| GET | `/api/badges` | Public badge catalog |
| GET | `/api/search/suggestions` | Search term suggestions (trending & personalized) |
| GET | `/api/users/[id]` | Public profile information |
| GET | `/api/users/[id]/stats` | Public aggregate player stats |
| GET | `/api/users/[id]/badges` | Earned and available badges for a player |

## 🙋 Player (Authenticated) Endpoints
These endpoints require a valid player session.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/attempts` | Start a quiz attempt (returns questions, config, attempt id) |
| GET | `/api/attempts/[id]` | Fetch attempt state/results |
| GET | `/api/attempts/[id]/next` | Fetch next question payload |
| PUT | `/api/attempts/[id]/answer` | Submit an answer (tracks skips, time spent) |
| POST | `/api/attempts/[id]/complete` | Complete an attempt, final scoring |
| POST | `/api/quizzes/[slug]/reviews` | Submit first review (requires completed attempt) |
| PATCH | `/api/reviews/[id]` | Update an existing review |
| DELETE | `/api/reviews/[id]` | Remove review |
| GET | `/api/friends` | Friend dashboard (friends, sent, received requests) |
| POST | `/api/friends` | Send friend request (by email) |
| GET | `/api/challenges` | Challenge dashboard (active, received, sent) |
| POST | `/api/challenges` | Create a challenge (friend + quiz) |
| GET | `/api/notifications` | Paginated notification feed |
| POST | `/api/questions/[id]/report` | File a content report (duplicates, errors, etc.) |

---
**Note**: All endpoints return a JSON envelope with `success`, `data`, and `message` fields.
