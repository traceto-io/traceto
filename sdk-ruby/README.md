# httrace Ruby SDK

Rack middleware for Rails, Sinatra, and any Rack-compatible app. Captures real HTTP traffic and sends it to the [Httrace](https://httrace.com) API, which automatically generates integration tests from it.

## Installation

```bash
gem install httrace
```

Or in your Gemfile:

```ruby
gem 'httrace'
```

## Usage

**Rails** (`config/application.rb`):
```ruby
require 'httrace'
config.middleware.use Httrace::CaptureMiddleware, api_key: 'ht_...'
```

**Sinatra / Rack**:
```ruby
require 'httrace'
use Httrace::CaptureMiddleware, api_key: 'ht_...', service: 'my-api'
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `api_key` | — | Your Httrace API key (required) |
| `service` | `"default"` | Service name label |
| `sample_rate` | `0.1` | Fraction of requests to capture (0.0–1.0) |
| `exclude_paths` | `["/health", "/metrics"]` | Paths to skip |
| `endpoint` | Httrace API | Override for self-hosted |

## Links

- [httrace.com](https://httrace.com)
- [Docs](https://httrace.com/docs)
- [GitHub](https://github.com/httrace-io/httrace)
