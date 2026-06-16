# GA4 and BigQuery setup

## GA4 (primary analytics)
| Field | Value |
|---|---|
| Measurement ID | `G-WKLHEDHC5D` (public; ships in page) |
| Account ID | `398033815` |
| Property ID | `541725914` |
| Stream ID | `15078146542` |
| Stream URL | `https://neurominds.in` |

The admin dashboard reads the **GA4 Data API** (`AnalyticsData` advanced service) for sessions, sources, devices, and key event counts. Enable the Analytics Data API in the Apps Script project and the linked Cloud project, and grant the deploying account access to the GA4 property.

### Event + parameter allowlist
Only the events in `shared/constants.js → GA4_EVENTS` are emitted, and only params in `GA4_ALLOWED_PARAMS`. `sanitizeGa4Params()` drops anything on `PII_BLOCKLIST`. **No name, phone, email, address, or clinical detail is ever sent.**

## BigQuery (sandbox / optional / archive only)
| Field | Value |
|---|---|
| Project ID | `jsnm-analytics` |
| Reporting dataset | `jsnm_reporting` |
| Location | `US` |
| Status | `sandbox_v1_optional` |
| Streaming export | `false` |
| Future GA4 export dataset | `analytics_541725914` |

Verified tables: `system_config`, `ga4_daily_traffic_summary`, `ga4_event_summary`, `ga4_lead_attribution_summary`, `admin_dashboard_cache`, `bq_job_audit`, `privacy_guardrails`.

### Hard rule
`BigQuery.Tabledata.insertAll()` is **never** used — the sandbox blocks streaming inserts. The only path into BigQuery is GA4's native daily export. `BigQueryHealthService` performs a **read-only** reachability check; it never writes. If batch loads are ever added, they must use load jobs from a Sheets buffer, never streaming.
