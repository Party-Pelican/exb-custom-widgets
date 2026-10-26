# Validation — direct browser version 1.2

On 2026-10-26 with Node.js v22.22.2, all 19 automated tests passed:
- APN preservation/deduplication and invalid input/date rejection.
- Documented parcel/type/status/date filter body.
- Pagination and ONT / NONPROD1 headers, including access token handling.
- Authentication failure, missing App ID, and malformed upstream response.
- Page cap marks parcel failed rather than returning truncated success.
- Record deduplication, bounded concurrency, and partial failures.
- App ID-only mode omits Authorization.
- Network/CORS error is reported against its failed APN.
- Cancellation propagates.
- Exact CSV columns and comma/quote/newline/Unicode handling.
- Spreadsheet formula neutralization.

Additional worker checks:
- Generated worker bundle executed on a real Node worker thread with mocked Accela fetch responses: search, progress, failure summary, paginated/filterable table, and Blob CSV.
- Cancel aborts worker search and clears the dataset; superseded jobs cannot publish results.
- Record cap excludes the entire overflowing parcel and completes progress.
- Cancellation interrupts retry backoff promptly.
- Actual TypeScript worker bridge exercised with a fake browser Worker: request IDs, abort/cancel, stale responses, startup errors, and teardown.

These tests exercise worker protocol behavior and generated code; Node worker-thread tests do not verify browser CORS, CSP, or the Enterprise asset loader.

The tests import the actual client shipped in widget/src/runtime/accela-core.js and the actual CSV function. JavaScript syntax and JSON files were also checked. No backend remains in this deliverable.

Not verified:
- Browser worker asset loading, CSP, and real browser memory/performance under large ONT responses.
- TypeScript compilation/Jimu rendering: no Experience Builder SDK is present.
- Enterprise version compatibility: exact release was not supplied.
- Live ONT NONPROD1 requests, browser CORS, App ID/token permissions, or parcel layer access.
- Actual ONT module names, APN equality, or application-opened versus record-created semantics.

The ZIP contains source and must be compiled in the compatible SDK before deployment.
