# Traceto

**Capture real production traffic. Auto-generate integration tests.**

[![PyPI](https://img.shields.io/pypi/v/traceto)](https://pypi.org/project/traceto/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/traceto-io/traceto/actions/workflows/sdk-ci.yml/badge.svg)](https://github.com/traceto-io/traceto/actions)

```bash
pip install traceto
```

## How it works

1. **Install** — add one line of middleware to your app
2. **Capture** — real traffic is captured and sanitized in the background
3. **Generate** — `traceto generate` writes pytest files directly into your repo

## Quickstart

```python
# FastAPI / Starlette
from traceto import TracetoCaptureMiddleware

app.add_middleware(
    TracetoCaptureMiddleware,
    api_key="tr_your_key_here",
    service="my-api",
)
```

```python
# Flask / Django (WSGI)
from traceto import TracetoCaptureMiddleware

app = TracetoCaptureMiddleware(app, api_key="tr_your_key_here", service="my-api")
```

Then generate tests:

```bash
traceto init       # creates traceto.config.yaml
traceto generate   # writes pytest files to tests/integration/
```

## Features

- Zero latency impact — fire-and-forget background queue
- Automatic PII sanitization (JWT, email, credit card, IBAN, phone, UUIDs)
- Deduplication — same endpoint shape captured once
- Session chain analysis — detects request dependencies
- Fixture inference — generates pytest setUp helpers from request bodies

## Documentation

- [SDK Configuration](docs/sdk-configuration.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

MIT — see [LICENSE](LICENSE).  
The Traceto backend and test generation service are proprietary.
