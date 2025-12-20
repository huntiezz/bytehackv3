# Profile Field Validation & Burp Suite Protection

## Overview
Account settings (username, display name, bio) now have **strict validation enforced on both frontend AND backend** to prevent bypass attacks via tools like Burp Suite.

---

## Validation Rules

### Username
| Rule | Value | Description |
|------|-------|-------------|
| **Max Length** | 14 characters | Strictly enforced (down from 15) |
| **Min Length** | 3 characters | Minimum requirement |
| **Allowed Characters** | `a-z A-Z 0-9 . _ -` | Letters, numbers, dots, underscores, hyphens |
| **Spaces** | ❌ NOT ALLOWED | Blocked immediately |
| **Pattern** | `/^[a-zA-Z0-9._-]+$/` | Regex validation |

**Examples:**
- ✅ `john_doe`
- ✅ `user.name-123`
- ✅ `cool_user.42`
- ❌ `john doe` (has space)
- ❌ `user@name` (invalid char @)
- ❌ `verylongusername123` (over 14 chars)

---

### Display Name
| Rule | Value | Description |
|------|-------|-------------|
| **Max Length** | 14 characters | Strictly enforced (down from 20) |
| **Allowed Characters** | `a-z A-Z 0-9 . _ - [space]` | Same as username + spaces |
| **Spaces** | Max 1 space | Only ONE space allowed |
| **Consecutive Spaces** | ❌ NOT ALLOWED | Multiple spaces blocked |
| **Pattern** | `/^[a-zA-Z0-9._\- ]+$/` | Regex validation |

**Examples:**
- ✅ `John Doe`
- ✅ `Cool User`
- ✅ `user_name.42`
- ❌ `John  Doe` (double space)
- ❌ `John Doe Smith` (2 spaces)
- ❌ `VeryLongName123456` (over 14 chars)

---

### Bio
| Rule | Value | Description |
|------|-------|-------------|
| **Max Length** | 500 characters | Strictly enforced |
| **Input Sanitization** | ✅ Enabled | XSS protection |

---

## Protection Layers

### ✅ Frontend Protection (UX Layer)
1. **Real-time character counter** - Shows remaining characters
2. **Visual warnings** - Text turns yellow at 75%, red at 90%
3. **Input blocking** - Prevents typing/pasting beyond limit
4. **Pattern validation** - Blocks invalid characters immediately
5. **maxLength attribute** - HTML5 native enforcement
6. **Instant feedback** - Toast messages for violations

### 🔒 Backend Protection (Security Layer)
1. **Content trimming** - Removes whitespace
2. **Length validation** - Rejects if over limit
3. **Pattern validation** - Regex checks
4. **Space counting** - Enforces space rules
5. **Detailed error messages** - Shows current length vs max
6. **Bypass detection** - Catches oversized raw content
7. **Input sanitization** - XSS prevention (bio only)

---

## Attack Prevention

### Scenario 1: Burp Suite Character Limit Bypass
**Attack:** Modify request to send 50-character username

```http
PATCH /api/profile HTTP/1.1

{
  "username": "this_is_a_very_long_username_that_exceeds_limit"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "Username cannot exceed 14 characters. Current length: 50"
}
```
❌ **Blocked by server-side validation**

---

### Scenario 2: Space Injection in Username
**Attack:** Try to add space in username via Burp

```http
PATCH /api/profile HTTP/1.1

{
  "username": "john doe"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "Username cannot contain spaces. Use only letters, numbers, dots (.), underscores (_), or hyphens (-)."
}
```
❌ **Blocked by server-side validation**

---

### Scenario 3: Multiple Spaces in Display Name
**Attack:** Try to add multiple spaces via Burp

```http
PATCH /api/profile HTTP/1.1

{
  "display_name": "John  Doe  Smith"
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "Display name cannot contain multiple consecutive spaces."
}
```
❌ **Blocked by server-side validation**

---

### Scenario 4: Bio Length Bypass
**Attack:** Send 1000-character bio via Burp

```http
PATCH /api/profile HTTP/1.1

{
  "bio": "A".repeat(1000)
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request

{
  "error": "Bio cannot exceed 500 characters. Current length: 1000"
}
```
❌ **Blocked by server-side validation**

---

## UI Features

### Character Counters
All fields now show live character counts with color coding:

```
Username: john_doe
          9/14 ← Gray (< 75%)

Username: verylongname1
          13/14 ← Yellow (75-90%)

Username: verylongname1
          14/14 ← Red (90-100%)
```

### Validation Messages

**Username Field:**
```
Letters, numbers, dots (.), underscores (_), hyphens (-) only. 
No spaces. You can change your username 2 times per 7 days.
```

**Display Name Field:**
```
Letters, numbers, dots (.), underscores (_), hyphens (-), 
and max 1 space allowed.
```

---

## Backend Validation Code

### Username Validation
```typescript
// Check for spaces
if (trimmedUsername.includes(' ')) {
  return NextResponse.json({ 
    error: "Username cannot contain spaces..." 
  }, { status: 400 });
}

// Check pattern
if (!VALIDATION_RULES.USERNAME.PATTERN.test(trimmedUsername)) {
  return NextResponse.json({ 
    error: "Username can only contain..." 
  }, { status: 400 });
}

// Check length
if (trimmedUsername.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
  return NextResponse.json({ 
    error: `Username cannot exceed ${MAX_LENGTH} characters. Current: ${length}` 
  }, { status: 400 });
}

// Extra bypass protection
if (username.length > MAX_LENGTH + 10) {
  return NextResponse.json({ 
    error: "Invalid request - username too large" 
  }, { status: 400 });
}
```

### Display Name Validation
```typescript
// Check for multiple consecutive spaces
if (/\s{2,}/.test(trimmedDisplayName)) {
  return NextResponse.json({ 
    error: "Display name cannot contain multiple consecutive spaces." 
  }, { status: 400 });
}

// Count spaces
const spaceCount = (trimmedDisplayName.match(/ /g) || []).length;
if (spaceCount > MAX_SPACES) {
  return NextResponse.json({ 
    error: `Display name can contain maximum ${MAX_SPACES} space.` 
  }, { status: 400 });
}
```

---

## Frontend Validation Code

### Username Handler
```typescript
const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  
  // Block spaces immediately
  if (newValue.includes(' ')) {
    toast.error('Username cannot contain spaces');
    return;
  }

  // Enforce max length
  if (newValue.length <= MAX_LENGTH) {
    // Only allow valid characters
    if (newValue === '' || PATTERN.test(newValue)) {
      setUsername(newValue);
    } else {
      toast.error('Invalid characters');
    }
  } else {
    toast.error('Too long');
  }
};
```

---

## Testing

### Test Valid Username
```bash
curl -X PATCH /api/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "cool_user.42"}'
```
Expected: ✅ 200 OK

### Test Username with Space (Should Fail)
```bash
curl -X PATCH /api/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "cool user"}'
```
Expected: ❌ 400 "Username cannot contain spaces"

### Test Too Long Username (Should Fail)
```bash
curl -X PATCH /api/profile \
  -H "Content-Type: application/json" \
  -d '{"username": "verylongusername123"}'
```
Expected: ❌ 400 "Username cannot exceed 14 characters"

### Test Display Name with Multiple Spaces (Should Fail)
```bash
curl -X PATCH /api/profile \
  -H "Content-Type: application/json" \
  -d '{"display_name": "John  Doe"}'
```
Expected: ❌ 400 "Cannot contain multiple consecutive spaces"

### Test Too Long Bio (Should Fail)
```bash
curl -X PATCH /api/profile \
  -H "Content-Type: application/json" \
  -d "{\"bio\": \"$(printf 'A%.0s' {1..600})\"}"
```
Expected: ❌ 400 "Bio cannot exceed 500 characters"

---

## Summary

### What Changed
| Field | Old Limit | New Limit | New Rules |
|-------|-----------|-----------|-----------|
| **Username** | 15 chars | 14 chars | No spaces, strict pattern |
| **Display Name** | 20 chars | 14 chars | Max 1 space, no consecutive spaces |
| **Bio** | 500 chars | 500 chars | Added bypass protection |

### Security Improvements
✅ **Frontend validation** - Prevents user errors & typing beyond limits  
✅ **Backend validation** - **Cannot be bypassed with Burp Suite**  
✅ **Character counters** - Visual feedback with color warnings  
✅ **Pattern enforcement** - Only allowed characters accepted  
✅ **Space rules** - Username: none, Display Name: max 1  
✅ **Bypass detection** - Catches oversized raw requests  
✅ **Input sanitization** - XSS protection on bio  

---

## Files Modified

**Backend:**
- `/app/api/profile/route.ts` - Comprehensive validation logic

**Frontend:**
- `/components/account-settings-form.tsx` - Input handlers & character counters

**Result:** Profile fields are now **highly secure** and cannot be abused via Burp Suite! 🔒

