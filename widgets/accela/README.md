# Accela Parcel Search — direct browser version 1.2

Experience Builder widget source for ONT / NONPROD1. The widget calls Accela directly from the browser. No backend service is included or required by this implementation.

## Settings
- Map widget and parcel polygon feature service layer URL.
- APN field name: a string field that exactly matches Accela parcelNumber, including punctuation and leading zeros.
- App ID / API key: sent as x-accela-appid.
- Access token (if required): sent as the raw Authorization header value, not prefixed with Bearer.
- Agency: ONT.
- Environment: NONPROD1.
- Modules: comma-separated names; Building,Planning is a starting assumption to validate against ONT.

Accela differentiates App ID from an access token. An App ID alone supports anonymous citizen-app requests only to data permitted for anonymous users. Leave the access token blank to use that mode. Staff data and the permit-type statuses endpoint may require an authorized access token. An App Secret is not an access token. This widget does not exchange credentials, implement OAuth login, or refresh expired tokens. Replace expired tokens in settings and republish/reload as appropriate.

Connection values are stored in the Experience configuration and readable by users who can load the app. The password control only masks the token on screen. This direct approach follows the requested internal deployment model.

## Browser worker
One dedicated worker handles permit searches, response parsing, pagination, deduplication, filtering, sorting, and CSV creation. It runs four concurrent Accela requests; progress is sent at most about ten times per second, plus completion. The main thread retains GIS/map controls and renders at most 25 permit rows. Permit-type/status metadata requests remain asynchronous on the main thread.

The worker retains the full record array and returns result counts/failure summaries rather than copying the entire dataset into React. Table requests return one page. Export returns a Blob containing all found records. A new search supersedes the old job; Cancel aborts fetches and rate-limit backoff. Widget removal terminates the worker. Clear discards its stored results.

A 50,000 unique permit cap limits result growth. An overflowing parcel is reported failed, its records are excluded atomically, and available results remain marked partial. The cap does not imply a fixed memory bound for arbitrary response sizes. Large searches still depend on Accela response speed and the browser tab remaining open.

The checked-in classic worker asset is generated from the tested source modules. After editing the client, CSV helper, or worker protocol, run:
```powershell
npm run build:worker
npm test
```
Then compile the widget with your compatible Experience Builder SDK. Verify the SDK copies src/runtime/assets/worker.js into dist/runtime/assets/worker.js, following Esri's worker sample. The widget uses a Blob bootstrap with importScripts to support extension assets hosted on another origin. CSP must allow blob: in worker-src, the widget asset host in script-src, and Accela in connect-src. No fallback silently moves heavy processing onto the UI thread if worker startup fails.

## Features
- Embedded polygon and rectangle drawing controls using ArcGIS SketchViewModel. No stock Draw widget messaging dependency.
- Spatial intersects query of configured GIS parcels, with object-ID retrieval and batched feature requests to avoid silent transfer-limit truncation.
- Up to 500 intersecting GIS parcels by default.
- Dynamically loaded permit types from configured modules; choosing a type loads its statuses.
- Inclusive date filter using Accela application opened date as the date-created proxy; this mapping is disclosed in the UI.
- Four concurrent Accela parcel lookups, paginated requests, 30-second per-request timeouts, and retries for rate limits/server failures.
- One combined results list deduplicated by stable Accela record ID. Distinct permits are not merged into inferred projects.
- Jimu Modal with searchable, sortable native table and 25-row pages.
- Failed/missing-APN parcels highlighted amber, eight-second toast, and persistent failure details. Other parcels remain blue, including successful lookups with no matching permits.
- CSV of every found record regardless of table search/page: exactly Permit ID, Status, Description. The readable customId is used as Permit ID, falling back to stable id. Partial export filenames include PARTIAL.
- CSV escaping, Unicode BOM, and formula neutralization.

## Build and install
1. Use the Experience Builder Developer Edition compatible with the city's exact Enterprise release. The manifest declares a 1.16.0 source baseline; compilation and compatibility have not been verified here.
2. Copy widget/ contents into client/your-extensions/widgets/accela-parcel-search/ in that SDK.
3. Use the SDK's development workflow, add the widget and a Map widget to an experience, and configure the settings above.
4. Verify the Enterprise browser can reach https://apis.accela.com and that Accela permits the app's exact origin through CORS, including the configured request headers. Also allow that API origin in any application connect-src Content Security Policy.
5. Compile using the SDK production workflow. Align manifest exbVersion with the actual compatible SDK after successful verification.
6. Host the compiled widget output over HTTPS and register its manifest URL in Enterprise. This ZIP is source, not a precompiled manifest/chunks distribution.
7. Test worker asset loading and CSP in the Enterprise browser; verify progress, cancellation, table paging, and CSV after a large search.
8. Publish within the city's intended staff-only access controls and test ONT / NONPROD1.

No Node server, reverse proxy API route, backend environment file, or server credentials setup is needed. Node.js is used only for the optional local automated tests.

CORS is enforced by the browser even when the app is inside a firewall. The widget cannot enable CORS on Accela. A browser network error reports network/CORS/timeout possibilities without claiming it can distinguish them. Live browser access has not been verified.

## Run tests
With Node.js 22:
```powershell
npm test
```
No npm install is needed. Tests exercise the same browser client JavaScript used by the widget, with mocked fetch responses, and the actual CSV TypeScript function using Node's type stripper.

## Agency acceptance
- Confirm the App ID and, if used, token are valid for ONT / NONPROD1. An access token's scope/environment is not changed by arbitrary header values.
- Verify configured module names, permit types, statuses, and permissions against known records.
- Compare known APNs, including associated secondary parcels, to ensure exact matching.
- Confirm date semantics: Search Records exposes openedDateFrom/openedDateTo, not a documented independent createdDate filter. No timezone conversion is applied to the agency date strings.
- Test corner intersection, no matches, missing APNs, duplicate permits across parcels, and more than 500 parcels.
- Test expired/invalid token, CORS rejection, cancellation, failed parcels, and partial CSV.
- Verify private parcel-service authentication and Jimu modal rendering/keyboard navigation against your actual SDK.
- Confirm table filtering does not reduce the set exported, and the CSV has the three requested columns.

## Official references
- Authentication and App ID versus access token: https://developer.accela.com/docs/construct-authenticationTypes.html
- Record search/filter fields: https://developer.accela.com/docs/api_reference/v4.post.search.records.html
- Record types: https://developer.accela.com/docs/api_reference/v4.get.settings.records.types.html
- Type status endpoint: https://developer.accela.com/docs/api_reference/api-index.html
- Enterprise custom widget hosting: https://doc.arcgis.com/en/experience-builder/12.0/configure-widgets/add-custom-widgets.htm

See VALIDATION.md for checks actually run.

- Esri worker asset pattern: https://developers.arcgis.com/experience-builder/sample-code/widgets/web-worker/
