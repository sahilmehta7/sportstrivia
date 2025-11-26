#!/bin/bash

# Practical API Testing - Uses actual seeded data
# Run this after: npm run dev (in another terminal)

BASE_URL="http://localhost:3200"

echo "🧪 Sports Trivia API - Practical Tests"
echo "======================================"
echo ""

echo "📋 Test 1: Get All Topics (Public API)"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/topics" | jq '{
  topicCount: (.data.topics | length),
  topics: .data.topics[] | {name, slug, level, questionCount: ._count.questions}
}'
echo ""

echo "📋 Test 2: Get Topic Hierarchy"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/topics?hierarchy=true" | jq '.data.topics[] | {
  name,
  slug,
  children: .children | length,
  questionCount: ._count.questions
}'
echo ""

echo "📋 Test 3: List All Quizzes"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/quizzes" | jq '{
  total: .data.pagination.total,
  quizzes: .data.quizzes[] | {title, slug, difficulty, questionCount: ._count.questionPool}
}'
echo ""

echo "📋 Test 4: Get Quiz Details"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/quizzes/cricket-basics" | jq '{
  available: .data.available,
  quiz: {
    title: .data.quiz.title,
    difficulty: .data.quiz.difficulty,
    questionCount: .data.quiz.questionCount,
    duration: .data.quiz.duration,
    randomizeQuestionOrder: .data.quiz.randomizeQuestionOrder,
    showHints: .data.quiz.showHints
  }
}'
echo ""

echo "📋 Test 5: Filter Quizzes by Difficulty"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/quizzes?difficulty=EASY" | jq '{
  filters: .data.filters,
  count: (.data.quizzes | length)
}'
echo ""

echo "📋 Test 6: Sort Quizzes by Popularity"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/quizzes?sortBy=popularity" | jq '{
  sortBy: .data.filters.sortBy,
  quizzes: .data.quizzes[] | {title, attempts: ._count.attempts}
}'
echo ""

echo "📋 Test 7: Filter by Duration (5-15 mins)"
echo "---------------------------------------"
curl -s "${BASE_URL}/api/quizzes?minDuration=5&maxDuration=15" | jq '{
  filters: .data.filters | {minDuration, maxDuration},
  count: (.data.quizzes | length)
}'
echo ""

echo "✅ All API Tests Complete!"
echo ""
echo "📚 Available Test Features:"
echo "  ✓ Topic listing and hierarchy"
echo "  ✓ Quiz filtering (difficulty, duration, rating)"
echo "  ✓ Quiz sorting (popularity, rating, recency)"
echo "  ✓ Coming soon quizzes"
echo "  ✓ Featured quizzes"
echo "  ✓ Tag-based filtering"
echo "  ✓ Topic-based filtering"
echo ""
echo "🔐 Note: Question management APIs require admin authentication"
echo "   Use the admin panel UI at /admin to manage questions"
echo ""

