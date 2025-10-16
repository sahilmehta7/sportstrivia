# Topic API Reference - Complete CRUD

## Overview

Topics are organized in a hierarchical tree structure (parent-child relationships) for categorizing questions and quizzes.

---

## Public Endpoints

### GET /api/topics

List all topics (public, no auth required).

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hierarchy` | boolean | `false` | Return nested tree structure |

**Examples:**

```bash
# Flat list of all topics
curl 'http://localhost:3000/api/topics'

# Hierarchical tree structure
curl 'http://localhost:3000/api/topics?hierarchy=true'
```

**Response (Flat):**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "cm...",
        "name": "Sports",
        "slug": "sports",
        "level": 0,
        "parentId": null,
        "_count": {
          "questions": 0
        }
      },
      {
        "id": "cm...",
        "name": "Cricket",
        "slug": "cricket",
        "level": 1,
        "parentId": "cm...",
        "_count": {
          "questions": 5
        }
      }
    ]
  }
}
```

**Response (Hierarchy):**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "cm...",
        "name": "Sports",
        "slug": "sports",
        "level": 0,
        "children": [
          {
            "name": "Cricket",
            "slug": "cricket",
            "level": 1,
            "children": [
              {
                "name": "Batting",
                "_count": { "questions": 3 }
              }
            ]
          }
        ],
        "_count": {
          "questions": 0
        }
      }
    ]
  }
}
```

---

## Admin Endpoints (Authentication Required)

### GET /api/admin/topics

List topics with advanced filtering options (admin only).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `parentId` | string | Filter by parent topic ID |
| `includeChildren` | boolean | Include child topics in response |
| `flat` | boolean | Return flat list sorted by level |
| `search` | string | Search in name and description |

**Examples:**

```bash
# Get all topics
curl 'http://localhost:3000/api/admin/topics'

# Get root topics only
curl 'http://localhost:3000/api/admin/topics?parentId=null'

# Get children of specific topic
curl 'http://localhost:3000/api/admin/topics?parentId={topic-id}&includeChildren=true'

# Search topics
curl 'http://localhost:3000/api/admin/topics?search=cricket'

# Flat list sorted by hierarchy
curl 'http://localhost:3000/api/admin/topics?flat=true'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "cm...",
        "name": "Cricket",
        "slug": "cricket",
        "description": "Cricket trivia",
        "level": 1,
        "parentId": "cm...",
        "parent": {
          "id": "cm...",
          "name": "Sports",
          "slug": "sports"
        },
        "children": [
          {
            "name": "Batting",
            "_count": { "questions": 3 }
          }
        ],
        "_count": {
          "questions": 5,
          "children": 2,
          "quizTopicConfigs": 3
        }
      }
    ],
    "total": 6
  }
}
```

---

### POST /api/admin/topics

Create a new topic (admin only).

**Request Body:**

```json
{
  "name": "NFL",
  "slug": "nfl",
  "description": "National Football League trivia",
  "parentId": "cm123..." // Optional - null for root topic
}
```

**Validation:**
- ✅ `name` must be unique
- ✅ `slug` must be unique
- ✅ `parentId` must exist if provided
- ✅ Level calculated automatically based on parent

**Example:**

```bash
# Create root topic
curl -X POST 'http://localhost:3000/api/admin/topics' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "NFL",
    "slug": "nfl",
    "description": "Football trivia",
    "parentId": null
  }'

# Create child topic
curl -X POST 'http://localhost:3000/api/admin/topics' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Quarterbacks",
    "slug": "quarterbacks",
    "description": "QB trivia",
    "parentId": "{nfl-topic-id}"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "name": "NFL",
    "slug": "nfl",
    "description": "Football trivia",
    "level": 0,
    "parentId": null,
    "parent": null,
    "_count": {
      "questions": 0,
      "children": 0
    },
    "createdAt": "2025-10-15T12:00:00.000Z",
    "updatedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

---

### GET /api/admin/topics/[id]

Get a single topic with details (admin only).

**Response Includes:**
- Topic details
- Parent topic info
- Child topics list
- Question count
- Usage in quizzes

**Example:**

```bash
curl 'http://localhost:3000/api/admin/topics/{topic-id}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "name": "Cricket",
    "slug": "cricket",
    "description": "Cricket trivia and facts",
    "level": 1,
    "parentId": "cm...",
    "parent": {
      "id": "cm...",
      "name": "Sports",
      "slug": "sports"
    },
    "children": [
      {
        "id": "cm...",
        "name": "Batting",
        "slug": "batting",
        "level": 2
      },
      {
        "id": "cm...",
        "name": "Bowling",
        "slug": "bowling",
        "level": 2
      }
    ],
    "_count": {
      "questions": 15,
      "children": 2,
      "quizTopicConfigs": 5
    }
  }
}
```

---

### PATCH /api/admin/topics/[id]

Update an existing topic (admin only).

**Request Body (all fields optional):**

```json
{
  "name": "Updated Name",
  "slug": "updated-slug",
  "description": "Updated description",
  "parentId": "new-parent-id" // or null to make root topic
}
```

**Features:**
- ✅ Validates slug uniqueness
- ✅ Auto-updates level when parent changes
- ✅ Updates all descendant levels recursively
- ✅ Prevents circular references
- ✅ Prevents setting child as parent

**Example:**

```bash
# Update topic name
curl -X PATCH 'http://localhost:3000/api/admin/topics/{id}' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Cricket Updated"}'

# Change parent (moves topic in hierarchy)
curl -X PATCH 'http://localhost:3000/api/admin/topics/{id}' \
  -H 'Content-Type: application/json' \
  -d '{"parentId": "{new-parent-id}"}'

# Make topic a root topic
curl -X PATCH 'http://localhost:3000/api/admin/topics/{id}' \
  -H 'Content-Type: application/json' \
  -d '{"parentId": null}'
```

**Validation Errors:**

```json
// Circular reference
{
  "error": "A topic cannot be its own parent",
  "code": "INTERNAL_ERROR"
}

// Child as parent
{
  "error": "Cannot set a descendant as parent (circular reference)",
  "code": "INTERNAL_ERROR"
}

// Duplicate slug
{
  "error": "A topic with this slug already exists",
  "code": "INTERNAL_ERROR"
}
```

---

### PUT /api/admin/topics/[id]

Alias for PATCH - same functionality.

---

### DELETE /api/admin/topics/[id]

Delete a topic (admin only).

**Safety Checks:**
- ✅ Cannot delete if topic has questions
- ✅ Cannot delete if topic has children
- ✅ Cannot delete if used in quiz configurations

**Example:**

```bash
curl -X DELETE 'http://localhost:3000/api/admin/topics/{id}'
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Topic deleted successfully"
  }
}
```

**Error Responses:**

```json
// Has questions
{
  "success": true,
  "data": {
    "message": "Cannot delete topic. It has 15 question(s). Please reassign questions first.",
    "canDelete": false
  }
}

// Has children
{
  "success": true,
  "data": {
    "message": "Cannot delete topic. It has 3 sub-topic(s). Please delete or reassign sub-topics first.",
    "canDelete": false
  }
}

// Used in quizzes
{
  "success": true,
  "data": {
    "message": "Cannot delete topic. It is used in 5 quiz configuration(s).",
    "canDelete": false
  }
}
```

---

## Topic Hierarchy Features

### Automatic Level Calculation

When you create or update a topic:
- Root topic (no parent): `level = 0`
- Child of root: `level = 1`
- Child of level 1: `level = 2`
- And so on...

**Level is calculated automatically!**

### Cascading Level Updates

When you change a topic's parent:
1. Topic's level is recalculated
2. All descendants' levels are updated recursively

**Example:**
```
Before:
Sports (L0) → Cricket (L1) → Batting (L2)

Move Cricket under new parent:
Sports (L0)
NFL (L0) → Cricket (L1) → Batting (L2)
```

### Circular Reference Protection

System prevents:
- Topic being its own parent
- Topic's child becoming its parent
- Any circular hierarchy

---

## Use Cases

### 1. Create Sport Category Structure

```bash
# 1. Create root sport
POST /api/admin/topics
{ "name": "Basketball", "slug": "basketball" }
# Returns: id = "bball-id"

# 2. Create sub-categories
POST /api/admin/topics
{ "name": "NBA", "slug": "nba", "parentId": "bball-id" }

POST /api/admin/topics
{ "name": "NCAA", "slug": "ncaa", "parentId": "bball-id" }

# Result:
# Basketball (L0)
#   ├── NBA (L1)
#   └── NCAA (L1)
```

### 2. Reorganize Hierarchy

```bash
# Move NBA under different parent
PATCH /api/admin/topics/{nba-id}
{ "parentId": "{new-parent-id}" }
```

### 3. Get Topic Tree for Dropdown

```bash
# For admin dropdowns
GET /api/admin/topics?flat=true

# For public filters
GET /api/topics
```

### 4. Search Topics

```bash
# Find all cricket-related topics
GET /api/admin/topics?search=cricket
```

---

## API Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/topics` | Public | List all topics (for dropdowns) |
| GET | `/api/topics?hierarchy=true` | Public | Get full tree structure |
| GET | `/api/admin/topics` | Admin | List with filters |
| GET | `/api/admin/topics?search=x` | Admin | Search topics |
| GET | `/api/admin/topics/{id}` | Admin | Get single topic |
| POST | `/api/admin/topics` | Admin | Create new topic |
| PATCH | `/api/admin/topics/{id}` | Admin | Update topic |
| PUT | `/api/admin/topics/{id}` | Admin | Update topic (alias) |
| DELETE | `/api/admin/topics/{id}` | Admin | Delete topic (with safety checks) |

---

## Data Model

```prisma
model Topic {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  parentId    String?
  level       Int      @default(0)
  
  // Self-referencing for tree
  parent      Topic?   @relation("TopicHierarchy", fields: [parentId], references: [id])
  children    Topic[]  @relation("TopicHierarchy")
  
  // Relations
  questions   Question[]
  quizTopicConfigs QuizTopicConfig[]
  userStats   UserTopicStats[]
}
```

---

## Best Practices

### Creating Topics

1. **Start with root topics**:
   ```
   Sports, Entertainment, History, etc.
   ```

2. **Add categories**:
   ```
   Sports → Basketball, Cricket, Football
   ```

3. **Add sub-categories** as needed:
   ```
   Basketball → NBA, NCAA, International
   Cricket → Batting, Bowling, Fielding
   ```

### Naming Conventions

- Use clear, descriptive names
- Slugs should be lowercase with hyphens
- Descriptions help users understand scope

### Hierarchy Depth

- **Recommended**: Max 3-4 levels deep
- **Example**:
  ```
  L0: Sports
  L1: Cricket  
  L2: Batting
  L3: Techniques (optional)
  ```

---

## Testing Guide

### Test Complete CRUD Flow

```bash
# 1. CREATE - Create a new topic
curl -X POST 'http://localhost:3000/api/admin/topics' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Soccer",
    "slug": "soccer",
    "description": "Soccer and football trivia"
  }'
# Note the returned ID

# 2. READ - Get the topic
curl 'http://localhost:3000/api/admin/topics/{topic-id}'

# 3. UPDATE - Change the name
curl -X PATCH 'http://localhost:3000/api/admin/topics/{topic-id}' \
  -H 'Content-Type: application/json' \
  -d '{"name": "Football (Soccer)"}'

# 4. DELETE - Remove the topic
curl -X DELETE 'http://localhost:3000/api/admin/topics/{topic-id}'
```

### Test Hierarchy Operations

```bash
# Create parent
POST /api/admin/topics
{ "name": "Tennis", "slug": "tennis" }
# Returns: tennis-id

# Create child
POST /api/admin/topics
{ "name": "Grand Slams", "slug": "grand-slams", "parentId": "{tennis-id}" }

# Move child to different parent
PATCH /api/admin/topics/{child-id}
{ "parentId": "{new-parent-id}" }

# Make child a root topic
PATCH /api/admin/topics/{child-id}
{ "parentId": null }
```

---

## Error Handling

### Duplicate Name
```json
{
  "error": "A topic with this name already exists",
  "code": "INTERNAL_ERROR"
}
```

### Duplicate Slug
```json
{
  "error": "A topic with this slug already exists",
  "code": "INTERNAL_ERROR"
}
```

### Topic Not Found
```json
{
  "error": "Topic not found",
  "code": "NOT_FOUND"
}
```

### Cannot Delete
```json
{
  "success": true,
  "data": {
    "message": "Cannot delete topic. It has 15 question(s).",
    "canDelete": false
  }
}
```

### Circular Reference
```json
{
  "error": "Cannot set a descendant as parent (circular reference)",
  "code": "INTERNAL_ERROR"
}
```

---

## Integration with Questions

### Filter Questions by Topic

```bash
# Get topic ID
TOPIC_ID=$(curl -s 'http://localhost:3000/api/topics' | jq -r '.data.topics[] | select(.slug == "cricket") | .id')

# Get all questions in this topic (includes child topics!)
curl "http://localhost:3000/api/admin/questions?topicId=${TOPIC_ID}"
```

### Topic Hierarchy in Question Selection

When you filter questions by "Cricket":
- Automatically includes "Batting" questions
- Automatically includes "Bowling" questions
- Automatically includes all descendant topics

**This is handled automatically in the quiz attempt API!**

---

## Database Operations

### Transaction Safety
- ✅ All operations use proper error handling
- ✅ Validation before database changes
- ✅ Cascading updates for hierarchy changes

### Referential Integrity
- ✅ Cannot delete topics with questions
- ✅ Cannot delete topics with children
- ✅ Cannot create circular references

### Performance
- ✅ Indexed on `slug` for fast lookups
- ✅ Efficient parent-child queries
- ✅ Level-based sorting

---

## Complete API List

```
✅ GET    /api/topics                    Public topic list
✅ GET    /api/topics?hierarchy=true     Tree structure
✅ GET    /api/admin/topics              Admin list with filters
✅ POST   /api/admin/topics              Create topic
✅ GET    /api/admin/topics/[id]         Get single topic
✅ PATCH  /api/admin/topics/[id]         Update topic
✅ PUT    /api/admin/topics/[id]         Update topic (alias)
✅ DELETE /api/admin/topics/[id]         Delete topic
```

---

## Next Steps

Now that Topic CRUD is complete, you can:

1. Build Topic Management UI in admin panel
2. Use topics in question creation form
3. Configure topic-based random quizzes
4. Display topic hierarchy in user-facing pages

All topic APIs are production-ready! 🎯

