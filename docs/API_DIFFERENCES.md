# API Differences: Claude (Anthropic) vs GPT (OpenAI)

This document explains the key differences between calling Claude (Anthropic) and GPT (OpenAI) APIs, specifically in the context of the RePhraseAI implementation.

## Table of Contents
- [1. Base Endpoint Structure](#1-base-endpoint-structure)
- [2. Headers](#2-headers)
- [3. Request Body Structure](#3-request-body-structure)
- [4. Temperature Constraints](#4-temperature-constraints)
- [5. Token Limit Parameters](#5-token-limit-parameters)
- [6. Streaming Response Format](#6-streaming-response-format)
- [7. Code Implementation in RePhraseAI](#7-code-implementation-in-rephraiseai)
- [8. Parsing Streaming Responses](#8-parsing-streaming-responses)
- [9. Summary Table](#9-summary-table)
- [10. Common Pitfalls](#10-common-pitfalls)

---

## 1. Base Endpoint Structure

### Claude (Anthropic)
```
POST https://api-epic.ir-gateway.abbvienet.com/iliad/anthropic/v1/messages
```

### GPT (OpenAI)
```
POST https://api-epic.ir-gateway.abbvienet.com/iliad/openai/deployments/{model}/chat/completions?api-version=2024-02-01
```

**Key Difference:**
- **Claude**: Single endpoint `/messages` for all models
- **OpenAI**: Deployment-specific URLs with model name in path + API version query parameter

---

## 2. Headers

### Claude (Anthropic)
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key",
  "anthropic-version": "2023-06-01"
}
```

### GPT (OpenAI)
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key"
}
```

**Key Difference:**
- Claude requires `anthropic-version` header
- OpenAI doesn't need version in header (it's in the URL query parameter)

---

## 3. Request Body Structure

### Claude (Anthropic)
```json
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    {
      "role": "user",
      "content": "System prompt + user text combined"
    }
  ],
  "stream": true,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### GPT (OpenAI)
```json
{
  "messages": [
    {
      "role": "system",
      "content": "System prompt"
    },
    {
      "role": "user",
      "content": "User text"
    }
  ],
  "stream": true,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

### Key Differences

| Aspect | Claude | GPT |
|--------|--------|-----|
| **Model in body** | ✅ Required | ❌ Not needed (in URL) |
| **System messages** | ❌ No separate system role | ✅ Has dedicated `system` role |
| **Max tokens param** | `max_tokens` | `max_tokens` (older models)<br>`max_completion_tokens` (O-series, GPT-5) |
| **Temperature** | 0-1 (flexible) | Must be 1.0 for O-series/GPT-5<br>0-2 for older models |

---

## 4. Temperature Constraints

### Claude
```python
# Always supports custom temperature
payload = {
    "temperature": 0.7  # Works for all Claude models
}
```

### GPT
```python
# Model-specific temperature handling
uses_new_api = any(x in model.lower() for x in ['o3', 'o4', 'gpt-5'])

if not uses_new_api:
    payload["temperature"] = 0.7  # Older models: flexible
else:
    # O-series and GPT-5: temperature=1 only (default, omit parameter)
    pass
```

**Key Difference:**
- **Claude**: All models support `temperature` 0-1
- **GPT**: Newer reasoning models (O3, O4, GPT-5) only support `temperature=1` (default)

---

## 5. Token Limit Parameters

### Claude
```python
payload = {
    "max_tokens": 4096  # Always use max_tokens
}
```

### GPT
```python
if uses_new_api:  # O3, O4, GPT-5
    payload["max_completion_tokens"] = 16384  # New parameter name
else:
    payload["max_tokens"] = 4096  # Old parameter name
```

**Key Difference:**
- **Claude**: Always `max_tokens`
- **GPT**: `max_tokens` (older) vs `max_completion_tokens` (newer models)
- **GPT**: Reasoning models often need higher limits (16384 vs 4096)

---

## 6. Streaming Response Format

### Claude (Anthropic) SSE Events
```
data: {"type":"message_start","message":{"id":"msg_123","role":"assistant"}}

data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" there"}}

data: {"type":"content_block_stop","index":0}

data: {"type":"message_stop"}
```

### GPT (OpenAI) SSE Events
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":" there"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### Key Differences

| Aspect | Claude | GPT |
|--------|--------|-----|
| **Event structure** | `{"type": "...", "delta": {...}}` | `{"choices": [{"delta": {...}}]}` |
| **Text location** | `delta.text` | `choices[0].delta.content` |
| **Stop signal** | `type: "message_stop"` | `finish_reason: "stop"` or `[DONE]` |

---

## 7. Code Implementation in RePhraseAI

Here's how `backend/app.py` handles both APIs:

```python
# Lines 53-71: Model type detection and URL generation

def get_model_type(model_name):
    """Determine if model is Anthropic or OpenAI based"""
    if model_name in AVAILABLE_MODELS.get('anthropic', []):
        return 'anthropic'
    elif model_name in AVAILABLE_MODELS.get('openai', []):
        return 'openai'
    # Default to anthropic if model starts with 'claude'
    return 'anthropic' if model_name.startswith('claude') else 'openai'


def get_gateway_url(model_name):
    """Get the appropriate gateway URL based on model type"""
    model_type = get_model_type(model_name)
    if model_type == 'openai':
        # OpenAI models use deployment-specific URLs
        return f"{OPENAI_GATEWAY_URL}/deployments/{model_name}/chat/completions?api-version=2024-02-01"
    else:
        # Anthropic models use messages endpoint
        return f"{ANTHROPIC_GATEWAY_URL}/messages"
```

```python
# Lines 127-172: Request preparation based on model type

# Get the appropriate gateway URL for the model
gateway_url = get_gateway_url(model)
model_type = get_model_type(model)

# Prepare headers
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}

# Prepare request payload based on model type
if model_type == 'anthropic':
    # Anthropic format
    headers['anthropic-version'] = '2023-06-01'
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": f"{system_prompt}\n\n{text}"}
        ],
        "stream": True,
        "max_tokens": 4096,
        "temperature": 0.7
    }
else:
    # OpenAI format
    # Newer models (O3, O4, GPT-5) use max_completion_tokens instead of max_tokens
    uses_new_api = any(x in model.lower() for x in ['o3', 'o4', 'gpt-5'])

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "stream": True
    }

    # GPT-5 and O-series models only support temperature=1 (default)
    # Other models can use custom temperature
    if not uses_new_api:
        payload["temperature"] = 0.7

    if uses_new_api:
        # O-series and GPT-5 models need more tokens for reasoning + completion
        payload["max_completion_tokens"] = 16384
    else:
        payload["max_tokens"] = 4096
```

---

## 8. Parsing Streaming Responses

The backend normalizes both streaming formats into a consistent format for the frontend:

```python
# Lines 220-240: Stream parsing

for line in response.iter_lines():
    if line:
        line_text = line.decode('utf-8')
        if line_text.startswith('data: '):
            data_str = line_text[6:]
            if data_str.strip() == '[DONE]':
                yield f"data: [DONE]\n\n"
                break

            try:
                chunk = json.loads(data_str)
                content = None

                # Handle Anthropic format
                if 'type' in chunk:
                    if chunk['type'] == 'content_block_delta':
                        delta = chunk.get('delta', {})
                        content = delta.get('text', '')
                    elif chunk['type'] == 'message_stop':
                        yield f"data: [DONE]\n\n"
                        break

                # Handle OpenAI format
                elif 'choices' in chunk and len(chunk['choices']) > 0:
                    delta = chunk['choices'][0].get('delta', {})
                    content = delta.get('content', '')

                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            except json.JSONDecodeError:
                continue
```

**Result:** Both APIs are normalized to this frontend format:
```
data: {"content": "text chunk"}
data: [DONE]
```

---

## 9. Summary Table

| Feature | Claude (Anthropic) | GPT (OpenAI) |
|---------|-------------------|--------------|
| **Endpoint** | `/messages` | `/deployments/{model}/chat/completions` |
| **Model in URL** | ❌ No | ✅ Yes |
| **Model in body** | ✅ Yes | ❌ No |
| **API version** | Header: `anthropic-version` | Query param: `?api-version=...` |
| **System role** | ❌ Combined with user | ✅ Separate message |
| **Temperature** | 0-1 (all models) | 0-2 (old), 1.0 only (new) |
| **Max tokens** | `max_tokens` | `max_tokens` or `max_completion_tokens` |
| **Stream format** | `type` + `delta.text` | `choices[].delta.content` |
| **Stop signal** | `message_stop` | `[DONE]` or `finish_reason` |
| **Reasoning models** | ❌ Not applicable | ✅ O3, O4 need special handling |

---

## 10. Common Pitfalls

### Claude (Anthropic)

❌ **Wrong:**
```python
# Forgetting anthropic-version header
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
}
# Result: 400 Bad Request
```

❌ **Wrong:**
```python
# Using separate system message
payload = {
    "messages": [
        {"role": "system", "content": "System prompt"},
        {"role": "user", "content": "User text"}
    ]
}
# Result: API doesn't recognize system role
```

✅ **Correct:**
```python
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'anthropic-version': '2023-06-01'
}

payload = {
    "model": "claude-sonnet-4-20250514",
    "messages": [
        {"role": "user", "content": f"{system_prompt}\n\n{user_text}"}
    ]
}
```

### GPT (OpenAI)

❌ **Wrong:**
```python
# Using max_tokens for O-series models
payload = {
    "max_tokens": 4096  # Wrong parameter for O3/O4/GPT-5
}
```

❌ **Wrong:**
```python
# Setting custom temperature for O-series/GPT-5
payload = {
    "temperature": 0.7  # O-series only supports 1.0
}
```

❌ **Wrong:**
```python
# Missing model from URL
url = "https://.../chat/completions"  # Where's the model?
```

✅ **Correct:**
```python
# For O-series/GPT-5
url = f"https://.../deployments/{model}/chat/completions?api-version=2024-02-01"
payload = {
    "messages": [...],
    "max_completion_tokens": 16384,
    # temperature omitted (defaults to 1.0)
}

# For older models
payload = {
    "messages": [...],
    "max_tokens": 4096,
    "temperature": 0.7
}
```

---

## Quick Reference: When to Use What

### Use Claude when:
- ✅ You want a single, consistent API across all models
- ✅ You need flexible temperature control
- ✅ You prefer simpler endpoint structure
- ✅ You're building a system that doesn't need model-specific logic

### Use GPT when:
- ✅ You need reasoning capabilities (O3, O4)
- ✅ You want separate system message handling
- ✅ You need higher token limits for complex tasks
- ✅ You want to leverage the latest frontier models (GPT-5)

### In RePhraseAI:
- ✅ **Both are supported seamlessly**
- ✅ The backend automatically detects model type
- ✅ Request formatting is handled transparently
- ✅ Streaming responses are normalized to a consistent format
- ✅ Users can switch between providers without changing frontend code

---

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/messages_post)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/chat)
- RePhraseAI Implementation: `backend/app.py` (lines 53-266)

---

**Last Updated:** October 2025
**Version:** 1.0
