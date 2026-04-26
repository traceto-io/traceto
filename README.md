# httrace

**Capture real traffic. Generate integration tests automatically.**

Httrace instruments your API with a middleware, records real HTTP interactions from production or staging, and outputs ready-to-run integration tests — including mock fixtures for every outgoing HTTP call and database query, so tests run in CI without any live infrastructure.

→ **[httrace.com](https://httrace.com)** · **[Docs](https://httrace.com/docs/)** · **[Dashboard](https://httrace.com)**

---

## How it works

```
1. Add middleware          →   Traffic is captured automatically
2. Use your app normally   →   Real requests become test cases
3. httrace generate        →   Ready-to-run tests with mock fixtures
```

No test writing. No manual mocks. No brittle fixtures.

---

## Quickstart

### Python (FastAPI / Flask / Django)

```bash
pip install httrace
```

```python
from httrace import HttraceCaptureMiddleware

app.add_middleware(
    HttraceCaptureMiddleware,
    api_key="ht_...",
    service="my-api",
    capture_outgoing=True,   # capture outgoing HTTP + SQL calls
    db_engines=[engine],     # optional: SQLAlchemy engines
)
```

### Node.js (Express)

```bash
npm install httrace
```

```js
const httrace = require('httrace');
app.use(httrace({ apiKey: 'ht_...', captureOutgoing: true }));
```

### Go

```bash
go get github.com/httrace-io/httrace-go
```

```go
cfg := httrace.Config{APIKey: "ht_...", CaptureOutgoing: true}
http.Handle("/", httrace.Middleware(cfg)(yourHandler))

// In handlers — use the recording client for outgoing calls:
client := httrace.ClientFromContext(r.Context())
resp, _ := client.Get("https://api.stripe.com/...")
```

### Ruby (Rails / Sinatra)

```bash
gem install httrace
```

```ruby
use Httrace::CaptureMiddleware,
    api_key: 'ht_...',
    capture_outgoing: true
```

---

## Generate tests

```bash
pip install httrace   # includes the CLI
httrace generate --service my-api --format pytest
```

Or via the API / dashboard. Supported formats: **pytest · Jest · Vitest · Go testing · RSpec**

---

## What gets generated

Given this captured interaction:

```
POST /orders  →  201 Created
  Outgoing: GET https://api.stripe.com/v1/charges/ch_123  →  200
  SQL:       SELECT * FROM orders WHERE user_id = ?        →  1 row
```

Httrace generates:

```python
# pip install pytest-respx pytest-mock

@pytest.fixture
def mock_outgoing_http(respx_mock):
    respx_mock.get("https://api.stripe.com/v1/charges/ch_123").mock(
        return_value=httpx.Response(200, json={"id": "ch_123", "amount": 2000}),
    )
    yield respx_mock

@pytest.fixture
def mock_db_queries(mocker):
    mock_conn = mocker.MagicMock()
    mock_conn.execute.return_value.fetchall.return_value = [{"id": "ord_1"}]
    yield mock_conn

def test_post_orders_201(client, auth_headers, mock_outgoing_http, mock_db_queries, payload):
    response = client.post("/orders", json=payload, headers=auth_headers)
    assert response.status_code == 201
    assert "order_id" in response.json()
```

Tests run **without** a live database, without external APIs, and without Docker — just `pytest`.

---

## Features

| | |
|---|---|
| **5 test formats** | pytest, Jest, Vitest, Go testing, RSpec |
| **Dependency mocking** | HTTP + SQL mocks auto-generated (respx, nock, MSW, httpmock, webmock) |
| **Auth fixtures** | Login flows auto-detected, `auth_headers` fixture generated |
| **PII sanitization** | Passwords, tokens, emails, card numbers redacted before storage |
| **API drift detection** | `httrace diff` exits 1 on breaking changes — blocks bad deploys in CI |
| **OpenAPI export** | Auto-generated spec from observed traffic |
| **Replay testing** | `httrace replay --target https://staging.example.com` |
| **Anomaly alerts** | Slack / email on error spikes or latency regressions |
| **GitHub Actions** | One-line integration, pre-built workflow template |
| **Dashboard** | Coverage, changes, and alert configuration at httrace.com |

---

## SDKs in this repo

| Directory | Language | Package |
|-----------|----------|---------|
| `sdk-node/` | Node.js | [`httrace` on npm](https://www.npmjs.com/package/httrace) |
| `sdk-go/` | Go | `github.com/httrace-io/httrace-go` |
| `sdk-ruby/` | Ruby | [`httrace` on RubyGems](https://rubygems.org/gems/httrace) |
| [`httrace-io/httrace-python`](https://github.com/httrace-io/httrace-python) | Python | [`httrace` on PyPI](https://pypi.org/project/httrace/) |

---

## Privacy & security

- All request/response bodies are sanitized before leaving your server
- Sensitive headers (`Authorization`, `Cookie`, `X-Api-Key`) are never stored
- Query parameters matching `api_key`, `token`, `secret`, `password` are redacted
- SQL parameter values are always replaced with `?`
- No data is sold or used for ML training

---

## License

MIT — see [LICENSE](LICENSE)

---

*Built by [httrace.com](https://httrace.com)*
