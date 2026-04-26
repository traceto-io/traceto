---
name: PII detection gap
about: The sanitizer missed a type of personal data
title: '[PII] '
labels: security, pii
---

**What type of PII was not detected?**
(e.g. Austrian IBAN, Dutch BSN, driving licence number)

**Example pattern (anonymized):**
```
# Use X's or placeholder values — never paste real PII
ATXX XXXX XXXX XXXX XXXX
```

**Field name where it appeared:**
```
{ "bank_account": "..." }
```

**Proposed detection approach:**
regex / ML / presidio entity type
