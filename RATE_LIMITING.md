# Complete Rate Limiting System

## Overview
Your application now has **comprehensive multi-layer rate limiting** across all major endpoints to prevent spam, abuse, and DoS attacks.

---

## 🛡️ Rate Limits by Feature

### 1. Post Creation (`/api/posts`)

| Layer | Limit | Window | Tracking Key |
|-------|-------|--------|--------------|
| IP-based | 5 posts | 1 hour | `post:ip:{ip}` |
| User-based | 10 posts | 1 hour | `post:user:{userId}` |
| Burst Protection | 2 posts | 5 minutes | `post:burst:{userId}` |

**Additional Protections:**
- ✅ Duplicate content detection (1 hour window)
- ✅ Security token required (one-time use)
- ✅ Token expires in 10 minutes
- ✅ Category permission checks
- ✅ Ban status verification

---

### 2. Token Generation (`/api/posts/token`)

| Layer | Limit | Window | Tracking Key |
|-------|-------|--------|--------------|
| IP-based | 15 tokens | 1 hour | `token:ip:{ip}` |
| User-based | 20 tokens | 1 hour | `token:user:{userId}` |
| Burst Protection | 5 tokens | 5 minutes | `token:burst:{userId}` |

**Purpose:** Prevents attackers from hoarding tokens for spam attacks

---

### 3. Thread Comments (`/api/comments`)

| Layer | Limit | Window | Tracking Key |
|-------|-------|--------|--------------|
| IP-based | 20 comments | 1 hour | `comment:ip:{ip}` |
| User-based | 30 comments | 1 hour | `comment:user:{userId}` |
| Burst Protection | 5 comments | 1 minute | `comment:burst:{userId}` |

**Additional Protections:**
- ✅ Duplicate comment detection (1 hour window)
- ✅ Short spam detection (3 short comments = blocked)
- ✅ 2000 character limit (enforced both sides)
- ✅ Input sanitization (XSS prevention)

---

### 4. Profile Comments (`/app/actions/profile-comments.ts`)

| Layer | Limit | Window | Tracking Key |
|-------|-------|--------|--------------|
| User-based | 20 comments | 1 hour | `profile_comment:user:{userId}` |
| Burst Protection | 3 comments | 1 minute | `profile_comment:burst:{userId}` |

**Additional Protections:**
- ✅ Duplicate comment detection
- ✅ 500 character limit (enforced both sides)
- ✅ Input sanitization

---

### 5. Comment Deletion (`DELETE /api/comments`)

| Layer | Limit | Window | Tracking Key |
|-------|-------|--------|--------------|
| User-based | 30 deletions | 1 hour | `comment:delete:{userId}` |

**Purpose:** Prevents rapid deletion spam/abuse

---

## 📊 Rate Limit Response Format

When rate limit is exceeded, the API returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 120
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1734567890

{
  "error": "Too many requests. Please try again in 2 minutes.",
  "retryAfter": 1734567890
}
```

**Headers:**
- `Retry-After`: Seconds until rate limit resets
- `X-RateLimit-Limit`: Maximum allowed requests
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## 🎯 Attack Scenarios & Prevention

### Scenario 1: Burp Intruder Post Spam
**Attack:** Send 100 posts in 10 seconds

**Protection Response:**
```
Post 1 → ✅ Success
Post 2 → ✅ Success  
Post 3 → ❌ 429 "Please slow down! Wait 298 seconds"
Posts 4-100 → ❌ All blocked by burst limit
```

**Why it fails:**
- Burst limit: only 2 posts per 5 minutes
- Even with new accounts, IP limit kicks in (5/hour)
- Tokens can only be used once

---

### Scenario 2: Comment Flood Attack
**Attack:** Send 50 comments in 30 seconds

**Protection Response:**
```
Comments 1-5 → ✅ Success (within burst limit)
Comment 6 → ❌ 429 "Slow down! Wait 56 seconds"
Comments 7-50 → ❌ All blocked
```

**Why it fails:**
- Burst limit: 5 comments per minute
- Total limit: 30 per hour
- Duplicate detection catches copy-paste

---

### Scenario 3: Token Hoarding Attack
**Attack:** Generate 100 tokens, use them slowly

**Protection Response:**
```
Tokens 1-5 → ✅ Generated (within burst limit)
Token 6 → ❌ 429 "Slow down! Wait 298 seconds"
... (attacker waits 5 minutes)
Tokens 6-10 → ✅ Generated
Token 11 → ❌ 429 (burst limit again)
```

**Why it fails:**
- Token generation burst limit: 5 per 5 minutes
- Tokens expire after 10 minutes
- Max 15 tokens per IP per hour
- Max 20 tokens per user per hour

---

### Scenario 4: VPN Rotation Attack
**Attack:** Rotate VPNs to bypass IP limits

**Protection Response:**
- User-based limits still apply (10 posts/hour)
- Burst limits still apply (2 posts/5min)
- Each token requires database verification
- Token generation also limited per user

**Why it fails:**
- User limits cannot be bypassed with IP changes
- Account creation is limited/monitored
- Burst protection is user-based

---

## 🔒 Database Storage

All rate limits are stored in the `rate_limits` table:

```sql
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,        -- e.g. "post:user:abc123"
  count INTEGER NOT NULL,           -- Current count in window
  expires_at TIMESTAMPTZ NOT NULL,  -- When window resets
  last_refill TIMESTAMPTZ,          -- Last token refill time
  tokens INTEGER                    -- Token bucket tokens
);
```

**Indexes:**
- `idx_rate_limits_key` - Fast lookups by key
- `idx_rate_limits_expires` - Cleanup expired entries

**Auto-cleanup:** Expired entries are periodically removed

---

## 📈 Rate Limit Comparison

### Industry Standards
| Service | Posts | Comments | Tokens |
|---------|-------|----------|--------|
| **Your App** | 2/5min, 10/hr | 5/min, 30/hr | 5/5min, 20/hr |
| Twitter | ~300/3hr | ~100/hr | N/A |
| Reddit | ~1/10min | ~10/min | N/A |
| Discord | ~5/5sec | ~5/5sec | N/A |

Your limits are **appropriately strict** for a forum platform while allowing legitimate usage.

---

## 🛠️ Configuration

All rate limits are defined as constants and can be adjusted:

```typescript
// app/api/posts/route.ts
const POST_RATE_LIMITS = {
  IP_LIMIT: 5,
  IP_WINDOW: 3600,
  USER_LIMIT: 10,
  USER_WINDOW: 3600,
  BURST_LIMIT: 2,
  BURST_WINDOW: 300,
};

// app/api/posts/token/route.ts
const TOKEN_RATE_LIMITS = {
  IP_LIMIT: 15,
  IP_WINDOW: 3600,
  USER_LIMIT: 20,
  USER_WINDOW: 3600,
  BURST_LIMIT: 5,
  BURST_WINDOW: 300,
};

// app/api/comments/route.ts
const COMMENT_RATE_LIMITS = {
  IP_LIMIT: 20,
  IP_WINDOW: 3600,
  USER_LIMIT: 30,
  USER_WINDOW: 3600,
  BURST_LIMIT: 5,
  BURST_WINDOW: 60,
};
```

---

## ✅ Summary

Your application now has **8-layer security** for content creation:

1. ✅ **IP-based rate limiting** - Prevents proxy/VPN spam
2. ✅ **User-based rate limiting** - Per-account quotas
3. ✅ **Burst protection** - Prevents rapid-fire attacks
4. ✅ **Token validation** - One-time use cryptographic tokens
5. ✅ **Duplicate detection** - Prevents copy-paste spam
6. ✅ **Content validation** - Length limits & sanitization
7. ✅ **Authentication** - Must be signed in
8. ✅ **Permission checks** - Category/feature access control

**Result:** Your platform is now **highly resistant** to automated spam attacks, Burp Suite attacks, and abuse! 🚀

