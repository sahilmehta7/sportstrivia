# Sports Trivia Conceptual Data Model

This document provides a high-level overview of the core entities in the Sports Trivia platform.

## Core Entities

### User
Represents a player on the platform.
- **Profile**: Name, Image, Bio, Favorite Teams.
- **Stats**: Total Points, Current/Longest Streak, Experience Tier.
- **Relations**: Friends, Badges, Quiz Attempts, Challenges.

### Topic
A hierarchical category for quizzes and questions.
- **Properties**: Name, Slug, Description, Emoji, Image.
- **Hierarchy**: Topics can have parents and children (e.g., "Sports" -> "Basketball" -> "NBA").
- **SEO**: Metadata for search engine indexing.

### Quiz
A collection of questions or a template for random question generation.
- **Properties**: Title, Slug, Description, Difficulty, Duration.
- **Configuration**: Passing score, timing rules, random/fixed question pools.
- **Stats**: Average Rating, Total Reviews, Popularity.

### Question
The building block of a quiz.
- **Properties**: Text, Difficulty, Type (Multiple Choice, etc.), Hint, Explanation.
- **Media**: Support for images, video, and audio in questions and explanations.
- **Answers**: Multiple choices with one or more correct options.

### Quiz Attempt
A single instance of a user playing a quiz.
- **Metrics**: Score, Accuracy, Time Spent, Streak length.
- **Responses**: Individual answers provided during the attempt.

### Gamification & Social
- **Badges**: Rewards for specific achievements or milestones.
- **Levels & Tiers**: Player progression system based on points earned.
- **Friendships**: Social links between users.
- **Challenges**: Head-to-head quiz competitions between friends.
- **Notifications**: Updates on challenges, friendship requests, and rewards.
