# Stage 1

## Core Actions

1. Create Notification
2. Fetch Notifications
3. Fetch Unread Notifications
4. Mark Notification as Read
5. Delete Notification
6. Real-Time Notification Delivery

---

## API 1 - Create Notification

POST /api/notifications

Request Body

{
  "userId": 1042,
  "type": "Placement",
  "message": "Google hiring drive started"
}

Response

{
  "notificationId": "abc123",
  "status": "created"
}

---

## API 2 - Get Notifications

GET /api/notifications?userId=1042&page=1&limit=20

Response

{
  "notifications": []
}

---

## API 3 - Get Unread Notifications

GET /api/notifications/unread?userId=1042

Response

{
  "notifications": []
}

---

## API 4 - Mark Notification Read

PATCH /api/notifications/{id}/read

Response

{
  "status": "read"
}

---

## API 5 - Delete Notification

DELETE /api/notifications/{id}

Response

{
  "status": "deleted"
}

---

## Headers

Authorization: Bearer <JWT_TOKEN>

Content-Type: application/json

---

## Real-Time Notification Mechanism

WebSocket will be used for real-time notification delivery.

Flow:

Client
   ↓
WebSocket Connection
   ↓
Notification Server
   ↓
Instant Notification Push

Benefits:
- No page refresh required
- Low latency
- Better user experience

# Stage 2

## Database Choice

I would use PostgreSQL as the primary database because it provides ACID compliance, strong indexing support, reliability, and excellent query optimization capabilities.

### Database Schema

#### Users Table

```sql
CREATE TABLE Users (
    UserID BIGINT PRIMARY KEY,
    Name VARCHAR(255),
    Email VARCHAR(255)
);
```

#### Notifications Table

```sql
CREATE TABLE Notifications (
    NotificationID UUID PRIMARY KEY,
    NotificationType VARCHAR(50),
    Message TEXT,
    CreatedAt TIMESTAMP
);
```

#### UserNotifications Table

```sql
CREATE TABLE UserNotifications (
    UserID BIGINT,
    NotificationID UUID,
    IsRead BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(UserID, NotificationID)
);
```

### Potential Problems

* Increased query latency
* Large table scans
* Slow unread notification retrieval
* Storage growth

### Solutions

* Proper indexing
* Table partitioning
* Redis caching
* Pagination
* Archiving old notifications

### Important Indexes

```sql
CREATE INDEX idx_user_read
ON UserNotifications(UserID, IsRead);

CREATE INDEX idx_notification_created
ON Notifications(CreatedAt DESC);
```

---

# Stage 3

## Query Analysis

Given Query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

### Why Is It Slow?

The query becomes slow because:

1. Database contains 5 million notifications.
2. Full table scans may occur.
3. Sorting large datasets is expensive.
4. Missing composite indexes.

### Better Index

```sql
CREATE INDEX idx_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

### Why Not Index Every Column?

Indexing every column:

* Increases storage usage
* Slows INSERT and UPDATE operations
* Creates unnecessary maintenance overhead

### Placement Notifications Query

```sql
SELECT *
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

### Expected Complexity

Without index:

O(N)

With composite index:

O(log N)

---

# Stage 4

## Problem

Notifications are fetched on every page load for every student.

This creates:

* Excessive database traffic
* High latency
* Poor user experience
* Increased infrastructure cost

## Proposed Solution

### Redis Cache

Store recent notifications in Redis.

### Pagination

Load notifications in chunks.

Example:

```http
GET /notifications?page=1&limit=20
```

### Infinite Scroll

Fetch additional notifications only when required.

### Lazy Loading

Load notifications only when notification panel is opened.

### WebSockets

Push new notifications in real time instead of polling.

## Tradeoffs

### Redis

Pros:

* Extremely fast reads

Cons:

* Additional infrastructure

### Pagination

Pros:

* Smaller DB queries

Cons:

* Additional frontend logic

### WebSockets

Pros:

* Real-time updates

Cons:

* Persistent connections

---

# Stage 5

## Problems In Current Implementation

Current implementation:

```python
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

Problems:

1. Sequential processing
2. Very slow for 50,000 users
3. Single failure can interrupt execution
4. No retry mechanism
5. Not scalable

## Improved Architecture

```text
Notification API
       |
       V
 Message Queue (Kafka/RabbitMQ)
       |
       V
 Worker Pool
       |
       +------> Email Service
       |
       +------> Database
       |
       +------> WebSocket Service
```

## Revised Pseudocode

```python
function notify_all(student_ids, message):

    create_notification_job(student_ids, message)

    enqueue_job(queue)

worker():

    while queue not empty:

        notification = dequeue()

        save_to_db(notification)

        send_email(notification)

        push_to_app(notification)
```

## Handling Failed Emails

* Retry mechanism
* Dead Letter Queue (DLQ)
* Failure logging
* Alerting system

## Should DB Save And Email Happen Together?

No.

Database write should happen first.

Email and push notification should be processed asynchronously by worker services.

This improves reliability and scalability.

---

# Stage 6

## Priority Inbox Design

Priority is determined using:

1. Notification Type
2. Recency

### Type Weights

| Type      | Weight |
| --------- | ------ |
| Placement | 5      |
| Result    | 4      |
| Event     | 3      |

### Priority Formula

```text
Priority Score =
(TypeWeight × 10) + RecencyScore
```

### Example

| Type      | Hours Old | Score |
| --------- | --------- | ----- |
| Placement | 2         | 58    |
| Result    | 5         | 45    |
| Event     | 1         | 39    |

### Algorithm

1. Fetch notifications.
2. Calculate priority score.
3. Sort in descending order.
4. Return top 10 notifications.

### JavaScript Implementation

```javascript
const typeWeights = {
  Placement: 5,
  Result: 4,
  Event: 3
};

function calculateScore(notification) {
  const ageHours =
    (Date.now() - new Date(notification.Timestamp))
    / (1000 * 60 * 60);

  const recencyScore = Math.max(0, 10 - ageHours);

  return (
    typeWeights[notification.Type] * 10
    + recencyScore
  );
}

notifications.sort(
  (a, b) =>
    calculateScore(b) -
    calculateScore(a)
);

const top10 =
  notifications.slice(0, 10);
```

### Maintaining Top 10 Efficiently

* Use Priority Queue (Max Heap)
* Keep only top 10 elements
* Complexity: O(N log 10)

### Benefits

* Fast retrieval
* Scalable
* Prioritizes important notifications
* Improves user experience

```
```
