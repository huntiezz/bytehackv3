# Comment Security: Length Limits, Rate Limiting & Burp Suite Protection

## Overview
All comment inputs now have **comprehensive multi-layer security** including character limits, rate limiting, and duplicate detection - all enforced on both frontend AND backend to prevent bypass attacks via tools like Burp Suite.

## Character Limits

| Comment Type | Max Length | Purpose |
|-------------|------------|---------|
| **Thread Comments** | 2000 characters | Standard forum replies |
| **Profile Comments** | 500 characters | Profile wall comments |

## Rate Limits

### Thread Comments (`/api/comments`)

| Layer | Limit | Window | Purpose |
|-------|-------|--------|---------|
| **IP-based** | 20 comments | 1 hour | Prevent VPN/proxy spam |
| **User-based** | 30 comments | 1 hour | Per-user quota |
| **Burst Protection** | 5 comments | 1 minute | Prevent rapid-fire spam |
| **Duplicate Detection** | 0 duplicates | 1 hour | Prevent copy-paste spam |
| **Short Spam Detection** | 3 short comments | Rolling | Prevent "nice" spam |

### Profile Comments (`/app/actions/profile-comments.ts`)

| Layer | Limit | Window | Purpose |
|-------|-------|--------|---------|
| **User-based** | 20 comments | 1 hour | Per-user quota |
| **Burst Protection** | 3 comments | 1 minute | Prevent rapid spam |
| **Duplicate Detection** | 0 duplicates | 1 hour | Prevent copy-paste |

### Comment Deletion (`DELETE /api/comments`)

| Layer | Limit | Window | Purpose |
|-------|-------|--------|---------|
| **User-based** | 30 deletions | 1 hour | Prevent abuse |

## Complete Security Layers

### Thread Comments (5 Layers)
1. ✅ **IP-based rate limiting** - 20/hour per IP
2. ✅ **User-based rate limiting** - 30/hour per user  
3. ✅ **Burst protection** - 5/minute max
4. ✅ **Duplicate detection** - Blocks identical comments
5. ✅ **Short spam detection** - Blocks repeated short comments
6. ✅ **Character limits** - 2000 chars max (frontend + backend)
7. ✅ **Input sanitization** - XSS protection
8. ✅ **Authentication** - Must be signed in

### Profile Comments (3 Layers)
1. ✅ **User-based rate limiting** - 20/hour per user
2. ✅ **Burst protection** - 3/minute max
3. ✅ **Duplicate detection** - Blocks identical comments
4. ✅ **Character limits** - 500 chars max (frontend + backend)
5. ✅ **Input sanitization** - XSS protection
6. ✅ **Authentication** - Must be signed in

## Attack Prevention Examples

### Example 1: Burp Suite Rapid Comment Spam
**Before (Vulnerable):**
```
Attacker sends 100 comments in 1 second via Burp Intruder
Result: 100 spam comments ❌
```

**After (Protected):**
```
Comment 1 → ✅ Success
Comment 2 → ✅ Success
Comment 3 → ✅ Success
Comment 4 → ✅ Success
Comment 5 → ✅ Success
Comment 6 → ❌ 429 "Slow down! Wait 56 seconds"
Comments 7-100 → ❌ All blocked by burst protection
```

### Example 2: Copy-Paste Spam
**Attack:** User copies same comment and pastes it 50 times

**Protection:**
```
Comment 1 → ✅ "Great post!"
Comment 2 → ❌ "You've already posted this comment recently."
```

### Example 3: Short Spam ("nice", "lol", etc.)
**Attack:** User posts "nice" 10 times in different threads

**Protection:**
```
Comment 1 → ✅ "nice" (9 chars)
Comment 2 → ✅ "cool" (4 chars)  
Comment 3 → ✅ "lol" (3 chars)
Comment 4 → ❌ "Please avoid posting very short comments repeatedly."
```

### Example 4: Character Limit Bypass via Burp Suite
**Attack:** Modify request to send 5000 character comment

```http
POST /api/comments HTTP/1.1

{"postId":"123","content":"A".repeat(5000)}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "Comment cannot exceed 2000 characters. Current length: 5000"
}
```
❌ **Blocked by server-side validation**

### What Attackers Might Try

| Attack Method | Frontend Blocks | Backend Blocks | Result |
|--------------|-----------------|----------------|--------|
| Type 3000 chars | ✅ Blocks at 2000 | N/A | Can't type more |
| Paste 3000 chars | ✅ Toast error | N/A | Paste rejected |
| Modify HTML maxLength | ✅ JS validation | ✅ Server validation | Both block |
| Burp Suite intercept | ❌ Bypasses frontend | ✅ Server validation | **BLOCKED** |
| Send raw request | ❌ No frontend | ✅ Server validation | **BLOCKED** |

## Code Changes

### Backend Validation (Thread Comments)
```typescript
// app/api/comments/route.ts
const COMMENT_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 2000,
};

// Trim and validate
const trimmedContent = content.trim();

if (trimmedContent.length > COMMENT_LIMITS.MAX_LENGTH) {
  return NextResponse.json({ 
    error: `Comment cannot exceed ${COMMENT_LIMITS.MAX_LENGTH} characters. Current length: ${trimmedContent.length}` 
  }, { status: 400 });
}

// Extra protection against bypass attempts
if (content.length > COMMENT_LIMITS.MAX_LENGTH + 1000) {
  return NextResponse.json({ 
    error: "Invalid request - content too large" 
  }, { status: 400 });
}
```

### Frontend Enforcement
```typescript
// components/comment-section.tsx
const COMMENT_MAX_LENGTH = 2000;

const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const newContent = e.target.value;
  if (newContent.length <= COMMENT_MAX_LENGTH) {
    setContent(newContent);
  } else {
    toast.error(`Comment cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
  }
};

// Before submit, double-check
if (content.trim().length > COMMENT_MAX_LENGTH) {
  toast.error(`Comment cannot exceed ${COMMENT_MAX_LENGTH} characters!`);
  return;
}
```

### UI Character Counter
```tsx
<div className="flex justify-between items-center text-sm">
  <span className={`${
    content.length > COMMENT_MAX_LENGTH * 0.9 
      ? 'text-red-500 font-semibold'      // > 90% = red warning
      : content.length > COMMENT_MAX_LENGTH * 0.75 
        ? 'text-yellow-500'                // > 75% = yellow warning
        : 'text-muted-foreground'          // < 75% = normal
  }`}>
    {content.length} / {COMMENT_MAX_LENGTH} characters
  </span>
</div>
```

## Testing

### Test Valid Comment
```bash
# Should succeed
curl -X POST /api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "123",
    "content": "This is a valid comment under 2000 chars"
  }'
```

### Test Oversized Comment (Burp Suite Simulation)
```bash
# Should fail with 400 error
curl -X POST /api/comments \
  -H "Content-Type: application/json" \
  -d "{
    \"postId\": \"123\",
    \"content\": \"$(printf 'A%.0s' {1..3000})\"
  }"
```

Expected response:
```json
{
  "error": "Comment cannot exceed 2000 characters. Current length: 3000"
}
```

## Security Benefits

1. **Prevents spam attacks** - Can't flood with huge comments
2. **Prevents DoS** - Limits database/memory usage
3. **Prevents UI breaking** - Oversized content can't break layout
4. **Consistent validation** - Same limits everywhere
5. **Cannot be bypassed** - Both frontend and backend enforce

## Files Modified

### Backend (API/Actions)
- `/app/api/comments/route.ts` - Thread comment validation
- `/app/actions/profile-comments.ts` - Profile comment validation

### Frontend (Components)
- `/components/comment-section.tsx` - Thread comment UI with counter
- `/components/profile-comments-dialog.tsx` - Profile comment UI with counter

## Best Practices Applied

✅ **Defense in depth** - Multiple validation layers
✅ **Fail securely** - Rejects oversized content, doesn't truncate
✅ **Clear error messages** - Users know exactly what's wrong
✅ **Consistent limits** - Same rules across frontend/backend
✅ **User feedback** - Visual indicators before hitting limit
✅ **Input sanitization** - Content is cleaned after validation
✅ **Rate limiting** - Already implemented (5 comments per minute)

## Related Security

These comment limits work alongside:
- Rate limiting (5 comments/min)
- Authentication checks (must be signed in)
- Input sanitization (XSS prevention)
- Content validation (no empty comments)

All work together to create a secure comment system! 🔒

