# Extraction report: Online Boutique, from the code

Output: `examples/online-boutique/index.html` (one diagram, architecture, technical viewpoint, `graphite` theme,
primary `#38bdf8`, secondary `#f472b6`, `pill` shape).
Check: `7 zones · 19 boxes · 22 connections · 5 tabs · 11 tour steps · 0 overlays` with 0 errors, 0 warnings
(`check.mjs --explain`: 0 connections through other boxes). I did not check it in a browser (the lead reviews it visually).

This is an unofficial diagram of Google's Online Boutique (Apache-2.0). It is not affiliated with Google.

## Sources read

Repository: https://github.com/GoogleCloudPlatform/microservices-demo, shallow clone, **commit
`38e7348eb289eb5b87c0c6e8cb19ced0449dc389`** (read 2026-10-24). I read the files and did not build or run anything.
Every `sources` entry in the diagram is a GitHub URL pinned to this commit, with line ranges.
`B` below = `https://github.com/GoogleCloudPlatform/microservices-demo/blob/38e7348eb289eb5b87c0c6e8cb19ced0449dc389/`.

| file | used for |
|---|---|
| `README.md` (L18–L37) | service list, languages, purpose; "11 microservices" |
| `protos/demo.proto` | the nine gRPC services and their RPCs (`what`, edge labels) |
| `src/frontend/main.go`, `rpc.go`, `handlers.go`, `middleware.go` | env addresses, `grpc.NewClient` per service, routes, which handler calls which RPC, session cookie |
| `src/checkoutservice/main.go` | env addresses, client connections, the `PlaceOrder` sequence and its error handling |
| `src/cartservice/src/Startup.cs`, `services/CartService.cs`, `cartstore/RedisCartStore.cs`, `cartservice.csproj` | store selection (Redis / Spanner / AlloyDB / in-memory), RPCs, how carts are stored, .NET version |
| `src/productcatalogservice/server.go`, `product_catalog.go`, `catalog_loader.go`, `products.json` | RPCs, JSON file vs AlloyDB, EXTRA_LATENCY, SIGUSR1/2 |
| `src/currencyservice/server.js`, `data/currency_conversion.json` | RPCs, EUR-based conversion from a static file |
| `src/paymentservice/charge.js`, `server.js` | mock charge: card validation, Visa/Mastercard only, UUID transaction ID |
| `src/shippingservice/main.go`, `quote.go`, `tracker.go` | mock quote (8.99 USD), tracking ID |
| `src/emailservice/email_server.py` | dummy mode only; real sender not implemented |
| `src/recommendationservice/recommendation_server.py` | catalog stub, random recommendations |
| `src/adservice/src/main/java/hipstershop/AdService.java` | GetAds, hard-coded ads by category |
| `src/loadgenerator/locustfile.py`, `Dockerfile` | Locust tasks and weights, `--host=http://${FRONTEND_ADDR}` |
| `src/*/Dockerfile` | languages and base images |
| `kubernetes-manifests/*.yaml`, `kustomization.yaml` | Deployments, Services, ports, `*_SERVICE_ADDR` and `REDIS_ADDR` values, LoadBalancer, emptyDir, security context, what is deployed by default |
| `skaffold.yaml` | image builds, the separate loadgenerator module |
| `release/kubernetes-manifests.yaml` | published image tags (v0.10.7) |
| `kustomize/components/` (listing; `non-public-frontend`, `memorystore` kustomizations) | optional components |

Not read (excluded in the config): generated protobuf code, lock files, `helm-chart/`, `terraform/`, `docs/`.

## Structure

`workflow.confirm_structure: false`, so this is the structure as proposed and built:

| area | boundary | boxes | why |
|---|---|---|---|
| Shoppers | external | Browser | the users, left of the frame |
| Test traffic | ours, outside the frame | Load generator | runs in the cluster but is optional and plays users |
| Entry | ours | Load balancer (frontend-external), Frontend | the only HTTP part; the hub of every page |
| Shopping services | ours | Ad service, Recommendation, Product catalog, Currency service, Cart service | what a page view calls; frontend-only services on top, services checkout also calls lower down |
| Checkout & payment | ours | Checkout service, Shipping service, Payment service, Email service | one PlaceOrder call and what it calls |
| Data & state | ours | Catalog file, Rates file, Redis cart store | where data lives (one real store, two files in images) |
| Where it runs | ours, base | Container images, Kubernetes manifests, Optional components | build and deploy |

Edge groups: `page` (page view), `order` (main flow: placing an order), `data`, `load`, `deploy`.

Tabs: Overview · Page view · Placing an order · Data & state · Deployment.

Personas: none (a code repository has no user roles; the config disables them).

Tour (one shopper, home page to placed order):
1. A shop made of eleven small services
2. Every request enters through the frontend
3. The home page asks four services
4. A product page adds a second hop
5. Add to cart: the only write before checkout
6. The cart page prices shipping before checkout
7. One PlaceOrder call starts the order
8. Checkout reprices the cart itself
9. Charge, ship, empty the cart, confirm
10. Twelve Deployments, wired by environment variables
11. Where to start reading

## Connections and their evidence

Evidence types: (A) the address environment variable read in code (`mustMapEnv`, `os.environ`, `Configuration[...]`),
(C) the client construction (`grpc.NewClient`, `pb.New…Client`, a Python stub, `AddStackExchangeRedisCache`, a file read),
(R) the RPC call site, (M) the address value in a manifest, (H) an HTTP call.

| # | connection | label | evidence |
|---|---|---|---|
| 1 | browser → lb | HTTP :80 | M: `kubernetes-manifests/frontend.yaml#L124-L137` (Service `frontend-external`, type LoadBalancer, 80 → 8080) |
| 2 | lb → frontend | | M: same Service, selector `app: frontend`, targetPort 8080 (`frontend.yaml#L124-L137`) |
| 3 | loadgen → frontend | HTTP frontend:80 | M: `loadgenerator.yaml#L82-L83` `FRONTEND_ADDR=frontend:80`; H: `src/loadgenerator/Dockerfile#L52` `locust --host=http://${FRONTEND_ADDR}`, `locustfile.py#L34-L76` `client.get/post` |
| 4 | frontend → ads | GetAds | A: `src/frontend/main.go#L138`; C: `main.go#L147`; R: `rpc.go#L119-L127`; M: `frontend.yaml#L81-L82` `adservice:9555` |
| 5 | frontend → recs | ListRecommendations | A: `main.go#L135`; C: `main.go#L144`; R: `rpc.go#L99-L117`; M: `frontend.yaml#L75-L76` |
| 6 | frontend → catalog | List/GetProduct | A: `main.go#L132`; C: `main.go#L142`; R: `rpc.go#L45-L55`; M: `frontend.yaml#L69-L70` |
| 7 | frontend → currency | Convert | A: `main.go#L133`; C: `main.go#L141`; R: `rpc.go#L30-L43`, `#L77-L85` (GetSupportedCurrencies, Convert); M: `frontend.yaml#L71-L72` |
| 8 | frontend → cart | GetCart · AddItem | A: `main.go#L134`; C: `main.go#L143`; R: `rpc.go#L57-L75` (GetCart, EmptyCart, AddItem); M: `frontend.yaml#L73-L74` |
| 9 | frontend → shipping | GetQuote | A: `main.go#L137`; C: `main.go#L145`; R: `rpc.go#L87-L97`; M: `frontend.yaml#L77-L78` |
| 10 | recs → catalog | | A: `recommendation_server.py#L131-L133`; C: `#L135-L136` (`insecure_channel`, `ProductCatalogServiceStub`); R: `#L73` `ListProducts`; M: `recommendationservice.yaml#L60-L61` |
| 11 | frontend → checkoutsvc | gRPC PlaceOrder | A: `main.go#L136`; C: `main.go#L146`; R: `handlers.go#L354-L369`; M: `frontend.yaml#L79-L80` |
| 12 | checkoutsvc → cart | GetCart · EmptyCart | A: `checkoutservice/main.go#L113`; C: `#L120`; R: `#L324-L337`; M: `checkoutservice.yaml#L67-L68` |
| 13 | checkoutsvc → catalog | GetProduct | A: `#L112`; C: `#L119`; R: `#L339-L357`; M: `checkoutservice.yaml#L57-L58` |
| 14 | checkoutsvc → currency | Convert | A: `#L114`; C: `#L121`; R: `#L359-L367`; M: `checkoutservice.yaml#L65-L66` |
| 15 | checkoutsvc → shipping | GetQuote · ShipOrder | A: `#L111`; C: `#L118`; R: `#L313-L322`, `#L386-L392`; M: `checkoutservice.yaml#L59-L60` |
| 16 | checkoutsvc → payment | Charge | A: `#L116`; C: `#L123`; R: `#L369-L377`; M: `checkoutservice.yaml#L61-L62` |
| 17 | checkoutsvc → email | SendOrderConfirmation | A: `#L115`; C: `#L122`; R: `#L379-L384`; M: `checkoutservice.yaml#L63-L64` `emailservice:5000` |
| 18 | cart → redis | Redis | A: `Startup.cs#L29`; C: `Startup.cs#L34-L40` (`AddStackExchangeRedisCache`); R: `RedisCartStore.cs#L33-L100` (`GetAsync`/`SetAsync`); M: `cartservice.yaml#L50-L51` `redis-cart:6379` |
| 19 | catalog → products | read at start | C/R: `catalog_loader.go#L44-L60` `os.ReadFile("products.json")` |
| 20 | currency → rates | require() | C/R: `currencyservice/server.js#L109-L113` `require('./data/currency_conversion.json')` |
| 21 | images → manifests | | `skaffold.yaml#L21-L50` (artifacts named like the manifests' `image:` fields, e.g. `kubernetes-manifests/cartservice.yaml#L46`) |
| 22 | components → manifests (dashed) | | `kubernetes-manifests/kustomization.yaml#L29-L39` (commented-out `components:`), e.g. `kustomize/components/memorystore/kustomization.yaml` patches |

Not drawn, with reason:
- frontend → shopping assistant (`SHOPPING_ASSISTANT_SERVICE_ADDR`, HTTP POST in `handlers.go#L451-L497`): the service is
  only deployed by the optional `shopping-assistant` kustomize component, not by the default `kustomization.yaml`. Mentioned in the
  "Optional components" box.
- `COLLECTOR_SERVICE_ADDR` (OpenTelemetry collector) in frontend, checkout, catalog, currency, payment, email, recommendation:
  only used when `ENABLE_TRACING=1`; the collector is deployed only by the `google-cloud-operations` component.

## Inventory (id → source)

`B` + path; line ranges as cited in the file.

| id | sources |
|---|---|
| zone shoppers | `README.md#L25-L37`, `kubernetes-manifests/frontend.yaml#L124-L137` |
| zone traffic | `kubernetes-manifests/kustomization.yaml#L23`, `skaffold.yaml#L96-L115` |
| zone entry | `src/frontend/main.go#L131-L163`, `kubernetes-manifests/frontend.yaml#L109-L137` |
| zone browse | `src/frontend/rpc.go#L30-L127`, `protos/demo.proto#L23-L75` |
| zone checkout | `src/checkoutservice/main.go#L230-L280`, `README.md#L31-L34` |
| zone data | `kubernetes-manifests/cartservice.yaml#L88-L157`, `src/productcatalogservice/catalog_loader.go#L33-L60`, `src/currencyservice/server.js#L106-L113` |
| zone platform | `kubernetes-manifests/kustomization.yaml#L15-L40`, `skaffold.yaml#L15-L50` |
| browser | `src/frontend/main.go#L148-L157`, `src/frontend/middleware.go#L85-L110` |
| loadgen | `src/loadgenerator/locustfile.py#L23-L92`, `kubernetes-manifests/loadgenerator.yaml#L40-L90`, `src/loadgenerator/Dockerfile#L52` |
| lb | `kubernetes-manifests/frontend.yaml#L124-L137`, `kustomize/components/non-public-frontend`, `istio-manifests/frontend-gateway.yaml` |
| frontend | `src/frontend/main.go#L131-L163`, `rpc.go#L30-L127`, `middleware.go#L85-L110`, `handlers.go#L525-L535`, `kubernetes-manifests/frontend.yaml#L66-L84` |
| ads | `src/adservice/.../AdService.java#L84-L194`, `protos/demo.proto#L243-L262` |
| recs | `src/recommendationservice/recommendation_server.py#L69-L86`, `#L130-L135`, `protos/demo.proto#L56-L69` |
| catalog | `src/productcatalogservice/product_catalog.go#L41-L80`, `catalog_loader.go#L33-L60`, `server.go#L88-L112`, `protos/demo.proto#L71-L105` |
| currency | `src/currencyservice/server.js#L106-L196`, `src/frontend/main.go#L49-L56`, `protos/demo.proto#L140-L175`, `README.md#L30` |
| cart | `src/cartservice/src/Startup.cs#L27-L58`, `services/CartService.cs#L24-L50`, `cartservice.csproj#L4`, `protos/demo.proto#L23-L50` |
| products | `src/productcatalogservice/products.json`, `catalog_loader.go#L44-L60` |
| rates | `src/currencyservice/data/currency_conversion.json`, `server.js#L106-L113` |
| redis | `kubernetes-manifests/cartservice.yaml#L88-L157`, `src/cartservice/src/cartstore/RedisCartStore.cs#L24-L100`, `kustomize/components/memorystore` |
| checkoutsvc | `src/checkoutservice/main.go#L110-L123`, `#L230-L392`, `kubernetes-manifests/checkoutservice.yaml#L55-L68`, `protos/demo.proto#L224-L241` |
| shipping | `src/shippingservice/main.go#L119-L153`, `quote.go#L33-L40`, `protos/demo.proto#L107-L138` |
| payment | `src/paymentservice/charge.js#L30-L86`, `protos/demo.proto#L177-L197` |
| email | `src/emailservice/email_server.py#L60-L132`, `#L200`, `kubernetes-manifests/emailservice.yaml#L71-L83`, `protos/demo.proto#L199-L222` |
| images | `skaffold.yaml#L15-L50`, `#L96-L115`, `release/kubernetes-manifests.yaml#L52` |
| manifests | `kubernetes-manifests/kustomization.yaml#L15-L40`, `frontend.yaml#L16-L84`, `checkoutservice.yaml#L16-L95` |
| components | `kubernetes-manifests/kustomization.yaml#L29-L40`, `kustomize/components` |

## Conflicts

1. **Currency rates.** `README.md#L30` says the currency service "uses real values fetched from European Central Bank".
   The code loads a static `data/currency_conversion.json` with `require()` and fetches nothing
   (`server.js#L109-L113`). Resolved by `sources.priority` (code first): the diagram says the rates are a static file.
2. **"11 microservices"** (`README.md#L18`) counts the load generator. The code has a frontend, nine gRPC backend
   services and the load generator (and an optional twelfth, the shopping assistant). The tour says "eleven small
   services" like the README; the hero says "a Go frontend and nine gRPC backend services … plus a load generator".
3. **Email service.** `README.md#L33` says it "sends users an order confirmation email (mock)"; the code always starts in
   dummy mode and only logs (`email_server.py#L108-L111`, `#L200`); the non-dummy path raises "not implemented". The
   diagram says it sends nothing.
4. **Load generator deployed or not.** `kubernetes-manifests/loadgenerator.yaml` exists and `release/kubernetes-manifests.yaml`
   includes it, but `kubernetes-manifests/kustomization.yaml#L23` comments it out (Skaffold deploys it as a separate
   module). Shown in its own zone outside the frame, described as optional.

## Gaps

- No replicas are set in the service manifests (only `loadgenerator.yaml` sets `replicas: 1`), so no scaling numbers are shown.
- The shopping assistant service, the OpenTelemetry collector, the optional "packaging service" (`PACKAGING_SERVICE_URL`,
  commented out in `frontend.yaml`), Istio and network policies are optional and appear only as text in the "Optional components" box.
- I did not read the Helm chart and the Terraform files. Spanner and AlloyDB cart stores were checked only as far as `Startup.cs` selects them.
- The number of currencies in `currency_conversion.json` is not stated (the frontend allows six: `main.go#L49-L56`).

## Status evidence

`map.status.enabled: false`: no status tags. What runs by default = the resources in `kubernetes-manifests/kustomization.yaml`
(ten services and redis-cart). The load generator is described as optional (see Conflict 4).

## Branding

No website branding and no logos (the config leaves `branding.website` empty). Logo `icon:shopping-bag`, theme `graphite`,
primary `#38bdf8`, secondary `#f472b6`, shape `pill`. `meta.url` links the GitHub repository. The hero footnote says it is
an unofficial diagram of Google's Online Boutique (Apache-2.0), not affiliated with Google.

## Assumptions

- Language/framework names come from Dockerfiles, `go.mod`, `cartservice.csproj` and imports (`gorilla/mux`,
  `@grpc/grpc-js`, `grpcio`, `simple-card-validator`, Locust `FastHttpUser`). Versions are only stated where a file pins them
  (.NET 10, release images v0.10.7).
- The "no refund" statement in the checkout panel is an observation of the code (no compensating call after a failed
  `ShipOrder`, `main.go#L252-L261`), not a statement by the authors.
- "Survive container restarts but not a new pod" for Redis follows from the `emptyDir` volume (`cartservice.yaml#L139-L141`) and how Kubernetes treats emptyDir.
- The two JSON files are drawn as boxes in "Data & state" although they are built into images, because "where state lives" is an engineering question this diagram answers.
