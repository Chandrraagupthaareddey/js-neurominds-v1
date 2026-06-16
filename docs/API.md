# API reference

Two Google Apps Script web apps. Requests use `?action=` (GET) or a JSON body `{ action, payload }` posted as `text/plain` (POST) to avoid CORS preflight. All responses are JSON: `{ success, data }` or `{ success: false, error, code }`.

## Public API (`gas-public-api`)

### GET (read, cached)
| action | returns |
|---|---|
| `config` | clinic config (safe subset of System_Config) |
| `navigation` | visible nav items |
| `conditions` / `treatments` / `services` / `doctors` / `labPackages` / `blogs` / `faqs` | published lists |
| `condition` / `treatment` / `doctor` / `blog` (`?slug=`) | a single item |
| `health` | API + workbook reachability + email quota |

### POST (write, rate-limited, validated)
| action | payload | effect |
|---|---|---|
| `submitCallback` | name, mobile, preferred date/time, concern, consent... | saves a callback request (not an appointment) |
| `submitLabRequest` | name, mobile, pickup area/date/time, package, consent | saves a lab home-collection request |
| `submitFeedback` | rating (1-5), message, consent | saves moderated-pending feedback |

Writes persist first, then attempt a non-blocking email. PII is never sent to analytics.

## Admin CMS (`gas-admin-cms`)

Every request is authenticated (active Google account must be an active row in Users) and re-checked against role permissions server-side.

| action | role gate | returns / effect |
|---|---|---|
| `me` | any authorized | current user identity + role |
| `config` | any | clinic config |
| `dashboard` | view dashboard | KPIs + GA4 analytics + recent callbacks |
| `callbacks` / `callbackChecklist` / `callbackQuestions` / `callbackHistory` | view callback | callback desk data |
| `updateCallbackStatus` | edit callback | status change + history + audit |
| `labRequests` | view lab | lab queue |
| `updateLabStatus` | edit lab | lab status change + audit |
| `content` | view content | all content (any status) |
| `doctors` | view doctors | doctor list |
| `feedback` | view feedback | feedback list |
| `updateFeedbackStatus` | edit feedback | moderate feedback |
| `publishContent` | publish content | publish a draft + record |
| `syncContent` | edit content | trigger Cloudflare Deploy Hook |
| `health` | view health | API/email/error/deploy + BigQuery reachability |
| `publishHistory` | view | publish log |
| `users` | view settings | users list |
| `runBackup` | super admin | copy both workbooks to dated Drive folder |
| `runbook` (`?mode=staff|admin`) | view runbook | runbook content |

### Error codes
`NOT_AUTHORIZED`, `FORBIDDEN:<section>`, `FORBIDDEN_EDIT:<section>`, `FORBIDDEN_PUBLISH`, `FORBIDDEN_BACKUP`, `UNKNOWN_ACTION`, `RATE_LIMITED`, `SERVER_ERROR`, `validation_failed`.
