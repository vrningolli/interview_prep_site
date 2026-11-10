/* System Design track — framework, building blocks, numbers, and classic designs.
   Lives outside content.json on purpose: `npm run extract` regenerates that file
   from the vanilla site and would wipe anything added there. */

export interface FrameworkStep {
  key: string;
  title: string;
  minutes: string;
  goal: string;
  checklist: string[];
  say: string;
}

export const FRAMEWORK: FrameworkStep[] = [
  {
    key: "requirements",
    title: "Requirements",
    minutes: "5 min",
    goal: "Agree on what you're building — and what you're not.",
    checklist: [
      "List 3–5 core functional requirements; park the rest as 'out of scope'",
      "Ask about scale: daily active users, reads vs writes, data size",
      "Pin the non-functional must-haves: latency, availability vs consistency, durability",
      "Write them down where the interviewer can see them",
    ],
    say: "“Before designing, let me confirm scope. Users can shorten a URL and get redirected — do we also need custom aliases, expiry or analytics?”",
  },
  {
    key: "estimates",
    title: "Back-of-envelope",
    minutes: "3–5 min",
    goal: "Turn the scale into numbers that drive design decisions.",
    checklist: [
      "Requests per second (average and peak ≈ 2–3× average)",
      "Storage per year, and whether it fits on one machine",
      "Read/write ratio — it decides caching and replication",
      "Round aggressively; say what each number implies",
    ],
    say: "“100M writes a day is about 1,200 per second, ~3K at peak. At 500 bytes each that's ~18 TB a year — too big for one box, so we'll shard.”",
  },
  {
    key: "api",
    title: "API & data model",
    minutes: "5 min",
    goal: "Define the contract and the core entities.",
    checklist: [
      "3–5 endpoints with inputs and outputs (REST is fine)",
      "Pagination for lists (cursor-based), idempotency keys for writes that retry",
      "Core tables/collections with primary keys and the access pattern for each",
      "Choose SQL vs NoSQL from the access patterns, not from habit",
    ],
    say: "“POST /urls returns a short code; GET /{code} returns a 301. The main table is code → long_url, read by primary key only — a key-value store fits.”",
  },
  {
    key: "high-level",
    title: "High-level design",
    minutes: "10 min",
    goal: "A working end-to-end diagram that satisfies every functional requirement.",
    checklist: [
      "Client → load balancer → stateless services → data stores",
      "Walk one write and one read through the diagram",
      "Add a cache and CDN where reads dominate",
      "Keep it simple first; optimise in the deep dive",
    ],
    say: "“Let me trace a redirect: the request hits the LB, the service checks Redis, falls back to the DB on a miss, then returns a 301.”",
  },
  {
    key: "deep-dive",
    title: "Deep dives",
    minutes: "15 min",
    goal: "Go deep on the 2–3 hardest parts — usually where the interviewer steers.",
    checklist: [
      "Name the bottleneck before fixing it",
      "Offer two options with trade-offs, then pick one and say why",
      "Cover sharding key, hot keys, cache invalidation, consistency",
      "Use real technologies only when you can justify them",
    ],
    say: "“The hard part is generating unique codes without coordination. Two options: a counter with base62, or random codes with a collision check. I'd pick…”",
  },
  {
    key: "wrap-up",
    title: "Bottlenecks & wrap-up",
    minutes: "5 min",
    goal: "Show production maturity: failures, monitoring, and what you'd do next.",
    checklist: [
      "Single points of failure and how each is removed",
      "What happens when a region, cache or queue goes down",
      "Metrics and alerts you'd add",
      "Summarise the design and the trade-offs you made",
    ],
    say: "“If Redis dies we fall back to the DB at higher latency; I'd alert on p99 redirect latency and cache hit rate.”",
  },
];

export interface Concept {
  key: string;
  title: string;
  oneLiner: string;
  explain: string;
  useWhen: string[];
  tradeoffs: string[];
  tip: string;
}

export const CONCEPTS: Concept[] = [
  {
    key: "scaling",
    title: "Vertical vs horizontal scaling",
    oneLiner: "Bigger machine, or more machines.",
    explain:
      "Vertical scaling adds CPU/RAM to one server — simple, but it has a ceiling and is a single point of failure. Horizontal scaling adds servers behind a load balancer; it needs stateless services so any server can handle any request.",
    useWhen: ["Vertical: early stage, databases that are hard to shard", "Horizontal: stateless web/API tiers, anything that must survive a machine failure"],
    tradeoffs: ["Horizontal needs session state moved out (to Redis or tokens)", "More machines = more coordination and more partial failures"],
    tip: "Say “the service tier is stateless, so it scales horizontally” early — it unlocks the rest of the design.",
  },
  {
    key: "load-balancing",
    title: "Load balancing",
    oneLiner: "Spread traffic across healthy servers.",
    explain:
      "A load balancer routes each request to a healthy backend using round robin, least connections, or hashing. L4 balancers route by IP/port; L7 balancers understand HTTP and can route by path or header.",
    useWhen: ["Any horizontally scaled tier", "Blue/green and canary deploys", "Health-checking and removing bad nodes"],
    tradeoffs: ["The LB itself must be redundant (active-passive pair or managed service)", "Sticky sessions break even load spreading"],
    tip: "Mention health checks — interviewers like hearing how dead servers leave the pool.",
  },
  {
    key: "caching",
    title: "Caching",
    oneLiner: "Keep hot data in memory to cut latency and DB load.",
    explain:
      "Cache-aside is the default: read the cache, on a miss read the DB and populate the cache. Write-through writes both at once; write-back writes the cache and flushes later. Eviction is usually LRU with a TTL.",
    useWhen: ["Read-heavy workloads (10:1 or more)", "Expensive computations or aggregations", "Data that tolerates slight staleness"],
    tradeoffs: ["Invalidation is the hard part — stale reads after writes", "Cache stampede when a hot key expires (use request coalescing or jittered TTLs)", "Hot keys can overload one cache node"],
    tip: "Always state the expected hit rate and what happens on a cold cache.",
  },
  {
    key: "cdn",
    title: "CDN",
    oneLiner: "Serve static and cacheable content from the edge.",
    explain:
      "A content delivery network caches files (images, video segments, JS) in data centres near users, cutting latency and origin load. Push CDNs get content uploaded ahead of time; pull CDNs fetch on first request.",
    useWhen: ["Media, static assets, video streaming", "Global users far from the origin"],
    tradeoffs: ["Purging/invalidating cached content takes time", "Costs scale with egress"],
    tip: "For any media-heavy design (YouTube, Instagram) the CDN carries most of the bandwidth — say so.",
  },
  {
    key: "sql-nosql",
    title: "SQL vs NoSQL",
    oneLiner: "Pick the store from the access pattern.",
    explain:
      "Relational databases give joins, transactions and strong consistency, and scale reads with replicas. NoSQL stores (key-value, wide-column, document) scale writes horizontally by partitioning, at the cost of joins and often of strong consistency.",
    useWhen: ["SQL: payments, inventory, anything with relationships and transactions", "Key-value: lookups by ID at huge scale", "Wide-column (Cassandra): write-heavy time series, messages, feeds"],
    tradeoffs: ["SQL sharding is manual and painful", "NoSQL pushes consistency and joins into application code"],
    tip: "Justify it: “Every read is by primary key and we need 50K writes/s, so a wide-column store fits.”",
  },
  {
    key: "replication",
    title: "Replication",
    oneLiner: "Copies of data for availability and read scale.",
    explain:
      "Leader-follower replication sends writes to one leader that streams changes to read replicas. Synchronous replication is safer but slower; asynchronous is fast but replicas lag. Multi-leader and leaderless (quorum) setups trade simplicity for write availability.",
    useWhen: ["Scaling reads", "Surviving a node or zone failure", "Serving reads closer to users"],
    tradeoffs: ["Replication lag → read-your-own-write anomalies", "Failover can lose recent async writes"],
    tip: "Mention read-your-writes: route a user's reads to the leader right after they write.",
  },
  {
    key: "sharding",
    title: "Sharding (partitioning)",
    oneLiner: "Split data across machines by a key.",
    explain:
      "Each shard holds a subset of rows chosen by a shard key — by range or by hash. A good key spreads load evenly and keeps a request's data on one shard.",
    useWhen: ["Data or write volume beyond one machine", "Isolating tenants"],
    tradeoffs: ["Cross-shard queries and transactions get expensive", "Hot shards from skewed keys (celebrities, popular items)", "Resharding is operationally hard — see consistent hashing"],
    tip: "Always name the shard key and say what query it makes fast and what it makes slow.",
  },
  {
    key: "consistent-hashing",
    title: "Consistent hashing",
    oneLiner: "Add or remove nodes while moving only ~1/N of keys.",
    explain:
      "Nodes and keys are hashed onto a ring; each key belongs to the next node clockwise. Adding a node only takes keys from its neighbour. Virtual nodes (many points per server) smooth out the distribution.",
    useWhen: ["Distributed caches", "Partitioned key-value stores", "Any cluster that grows or shrinks often"],
    tradeoffs: ["More complex than modulo hashing", "Still needs replication for durability"],
    tip: "Contrast with hash(key) % N, where adding one server remaps almost every key.",
  },
  {
    key: "cap",
    title: "CAP & consistency models",
    oneLiner: "During a network partition, choose consistency or availability.",
    explain:
      "When nodes can't talk to each other, a system either rejects some requests (CP) or serves possibly stale data (AP). Beyond CAP: strong consistency, read-your-writes, and eventual consistency are points on a spectrum.",
    useWhen: ["CP: payments, inventory counts, leader election", "AP: feeds, likes, view counts, presence"],
    tradeoffs: ["Strong consistency costs latency (coordination)", "Eventual consistency needs conflict resolution"],
    tip: "Decide per feature, not per system: “Likes can be eventually consistent; the payment ledger can't.”",
  },
  {
    key: "queues",
    title: "Message queues & async processing",
    oneLiner: "Decouple producers from slow or bursty work.",
    explain:
      "A queue or log (SQS, RabbitMQ, Kafka) buffers work so the request path can return fast while workers process in the background. Kafka-style logs also let many consumers replay the same event stream.",
    useWhen: ["Sending emails/notifications, video transcoding, fan-out", "Smoothing traffic spikes", "Event-driven pipelines between services"],
    tradeoffs: ["At-least-once delivery → consumers must be idempotent", "Harder to debug; needs dead-letter queues and monitoring", "Ordering is only per partition"],
    tip: "Whenever work takes more than ~100 ms and the user doesn't need the result now, put it on a queue.",
  },
  {
    key: "rate-limiting",
    title: "Rate limiting",
    oneLiner: "Cap how often a client can call you.",
    explain:
      "Token bucket allows bursts up to a bucket size while refilling at a steady rate; sliding-window counters track requests in the last N seconds. Distributed limiters keep counters in Redis with atomic operations.",
    useWhen: ["Public APIs", "Protecting expensive endpoints and logins", "Fair use between tenants"],
    tradeoffs: ["Central counters add a network hop", "Local limits are fast but inexact across servers"],
    tip: "Return 429 with a Retry-After header — interviewers notice API details.",
  },
  {
    key: "idempotency",
    title: "Idempotency & retries",
    oneLiner: "Make it safe to do the same thing twice.",
    explain:
      "Networks fail mid-request, so clients retry. An idempotency key lets the server recognise a repeat and return the original result instead of charging twice. Retries use exponential backoff with jitter.",
    useWhen: ["Payments and orders", "Queue consumers (at-least-once delivery)", "Any POST a client might retry"],
    tradeoffs: ["Keys must be stored for a while", "Backoff adds latency to failures"],
    tip: "Pair it with queues: “Consumers dedupe on message ID, so redelivery is harmless.”",
  },
  {
    key: "realtime",
    title: "Real-time delivery",
    oneLiner: "Polling, long polling, SSE, or WebSockets.",
    explain:
      "Short polling is simple but wasteful. Long polling holds the request open until there's data. Server-Sent Events stream one way from server to client; WebSockets are full duplex. Real-time servers are stateful, so you need a registry of which server holds each connection.",
    useWhen: ["Chat, live comments, presence", "Collaborative editing", "Live dashboards and notifications"],
    tradeoffs: ["Persistent connections are stateful and harder to load-balance", "Mobile apps also need push notifications when the app is closed"],
    tip: "Say how a message finds the right server: a connection registry in Redis plus pub/sub between servers.",
  },
  {
    key: "storage",
    title: "Blob storage",
    oneLiner: "Put big files in object storage, not in the database.",
    explain:
      "Object stores (S3, GCS) hold images, videos and backups cheaply and durably. The database keeps only metadata and the object's key. Clients often upload directly with a pre-signed URL so files never pass through your servers.",
    useWhen: ["User uploads, media, documents", "Logs and data-lake files"],
    tradeoffs: ["Higher latency than local disk", "Needs a CDN in front for hot content"],
    tip: "“Upload goes straight to S3 via a pre-signed URL; the service only stores metadata.”",
  },
];

/** Latency and capacity numbers worth memorising (rounded, order-of-magnitude). */
export const NUMBERS: [string, string, string][] = [
  ["L1 cache reference", "~1 ns", ""],
  ["Main memory reference", "~100 ns", "100× L1"],
  ["Read 1 MB sequentially from memory", "~3 µs", ""],
  ["SSD random read", "~16 µs", ""],
  ["Read 1 MB sequentially from SSD", "~50 µs", ""],
  ["Round trip within a data centre", "~0.5 ms", ""],
  ["Redis / Memcached GET", "~0.5–1 ms", "network-bound"],
  ["Simple indexed DB query", "~1–10 ms", ""],
  ["Disk seek (HDD)", "~10 ms", "avoid on hot paths"],
  ["Round trip US ↔ Europe", "~80–150 ms", "why CDNs exist"],
];

export const CAPACITY: [string, string][] = [
  ["Seconds in a day", "~86,400 ≈ 10⁵"],
  ["1M requests/day", "≈ 12 per second"],
  ["100M requests/day", "≈ 1,200 per second"],
  ["One app server (simple API)", "~1K–10K requests/s"],
  ["One Redis node", "~100K ops/s"],
  ["One SQL primary (writes)", "~1K–10K writes/s"],
  ["Peak traffic", "≈ 2–3× the average"],
];

export interface DesignProblem {
  key: string;
  title: string;
  level: "Starter" | "Core" | "Advanced";
  prompt: string;
  functional: string[];
  nonFunctional: string[];
  estimates: string[];
  api: string[];
  dataModel: string[];
  highLevel: string[];
  deepDives: { q: string; a: string }[];
  pitfalls: string[];
  concepts: string[];
}

export const DESIGNS: DesignProblem[] = [
  {
    key: "url-shortener",
    title: "URL shortener",
    level: "Starter",
    prompt: "Design a service that turns long URLs into short links and redirects visitors.",
    functional: ["Create a short code for a long URL", "Redirect a short code to its long URL", "Optional: custom alias, expiry, click counts"],
    nonFunctional: ["Very low redirect latency (< 50 ms)", "Highly available — broken links are visible", "Codes must never collide"],
    estimates: ["100M new URLs/day ≈ 1.2K writes/s", "Read:write ≈ 100:1 → ~120K redirects/s at peak", "~500 B per row → ~18 TB/year"],
    api: ["POST /urls {longUrl, alias?, ttl?} → {code}", "GET /{code} → 301/302 Location: longUrl"],
    dataModel: ["urls(code PK, long_url, user_id, created_at, expires_at)", "Key-value store keyed by code; shard by hash(code)"],
    highLevel: ["LB → stateless API servers", "Write path: generate code → store", "Read path: cache (Redis) → DB on miss → redirect", "Async click events to a queue for analytics"],
    deepDives: [
      { q: "How do you generate unique codes?", a: "Option A: a distributed counter (ranges handed out per server) encoded in base62 — 7 chars gives 62⁷ ≈ 3.5 trillion codes. Option B: hash/random + collision check on insert. Counter ranges avoid collisions without a check per write." },
      { q: "301 or 302?", a: "301 is cached by browsers (less load, but you lose click analytics); 302 hits you every time. Pick 302 if analytics matter." },
      { q: "How do you handle hot links?", a: "Cache-aside in Redis with LRU; very hot codes can also sit in each server's in-process cache." },
    ],
    pitfalls: ["Using auto-increment IDs that leak volume and are guessable", "Forgetting expiry cleanup", "No plan for cache misses at 100K reads/s"],
    concepts: ["caching", "sharding", "consistent-hashing"],
  },
  {
    key: "rate-limiter",
    title: "Distributed rate limiter",
    level: "Starter",
    prompt: "Design a rate limiter that caps each client's requests across a fleet of API servers.",
    functional: ["Limit requests per user/IP/API key per time window", "Configurable rules per endpoint", "Return 429 with Retry-After when exceeded"],
    nonFunctional: ["Adds < 5 ms to each request", "Accurate across many servers", "Fails open if the limiter is down"],
    estimates: ["1M requests/s across the fleet", "10M active keys × ~100 B ≈ 1 GB of counters — fits in Redis memory"],
    api: ["Middleware: allow(key, rule) → {allowed, remaining, resetAt}", "Admin: PUT /rules/{id}"],
    dataModel: ["Redis: key = rule:client:window → counter or token bucket {tokens, lastRefill}", "Rules in a config store, cached in each server"],
    highLevel: ["Limiter runs as middleware or at the API gateway", "Counters in a Redis cluster, sharded by client key", "Rules pushed to servers on change"],
    deepDives: [
      { q: "Which algorithm?", a: "Token bucket allows short bursts and is cheap (two fields per key). Sliding-window log is exact but stores every timestamp. Sliding-window counter approximates well with two counters." },
      { q: "How do you avoid race conditions?", a: "Do read-modify-write atomically: a Redis Lua script or INCR with EXPIRE." },
      { q: "What if Redis is slow or down?", a: "Fail open with a local in-memory limiter as a fallback, and alert. Blocking all traffic is worse than briefly over-admitting." },
    ],
    pitfalls: ["Fixed windows letting 2× traffic through at the boundary", "Non-atomic counter updates", "Not telling clients when to retry"],
    concepts: ["rate-limiting", "caching", "consistent-hashing"],
  },
  {
    key: "notifications",
    title: "Notification system",
    level: "Core",
    prompt: "Design a service that sends push, SMS and email notifications for other teams' events.",
    functional: ["Accept notification requests from internal services", "Deliver via push, SMS, email", "Respect user preferences and quiet hours", "Retry failures; track delivery status"],
    nonFunctional: ["Never lose a notification; avoid duplicates where possible", "Handle spikes (marketing blasts)", "Soft real-time (seconds)"],
    estimates: ["10M push + 1M email + 100K SMS a day", "Spikes of 10× during campaigns"],
    api: ["POST /notify {userId, template, channel?, data, idempotencyKey}", "GET /notifications/{id}/status"],
    dataModel: ["preferences(user_id, channel, enabled, quiet_hours)", "devices(user_id, token, platform)", "notification_log(id, user_id, channel, status, attempts)"],
    highLevel: ["API validates + dedupes → writes to a queue", "Per-channel worker pools read queues and call providers (APNs/FCM, SES, Twilio)", "Retries with backoff; dead-letter queue after N attempts", "Status updates written to the log"],
    deepDives: [
      { q: "How do you avoid sending twice?", a: "Idempotency key on the request plus dedupe in the log before sending. Providers can still double-deliver, so aim for at-least-once with dedupe." },
      { q: "How do you survive a provider outage?", a: "Separate queues per channel isolate failures; a circuit breaker pauses a failing provider; secondary providers for SMS/email." },
      { q: "How do you handle a 50M-user campaign?", a: "Fan out in batches through the queue, rate-limit per provider, and schedule by time zone." },
    ],
    pitfalls: ["Calling providers synchronously in the request path", "One queue for all channels", "Ignoring user opt-outs"],
    concepts: ["queues", "idempotency", "rate-limiting"],
  },
  {
    key: "news-feed",
    title: "News feed",
    level: "Core",
    prompt: "Design the home feed for a social network: users see recent posts from people they follow.",
    functional: ["Create a post", "Follow users", "View a personalised feed, newest or ranked first", "Paginate (infinite scroll)"],
    nonFunctional: ["Feed loads in < 200 ms", "Posts appear within seconds (eventual consistency is fine)", "Handle celebrities with millions of followers"],
    estimates: ["300M DAU, 10 feed loads/day ≈ 35K reads/s", "50M posts/day ≈ 600 writes/s", "Average 200 followees"],
    api: ["POST /posts", "POST /follows/{userId}", "GET /feed?cursor=…&limit=20"],
    dataModel: ["posts(id, author_id, text, media_key, created_at)", "follows(follower_id, followee_id)", "feed_cache: user_id → list of post ids (Redis)"],
    highLevel: ["Post service writes the post, then emits an event", "Fan-out workers push the post id into followers' feed caches", "Feed service reads the cached id list, hydrates posts, ranks", "Media in object storage behind a CDN"],
    deepDives: [
      { q: "Fan-out on write or on read?", a: "Push (write) makes reads fast but is expensive for celebrities. Pull (read) is cheap to write but slow to read. Hybrid: push for normal users, pull celebrity posts at read time and merge." },
      { q: "How does pagination stay stable?", a: "Cursor = (timestamp, post id) of the last item, not page numbers, so new posts don't shift results." },
      { q: "Where does ranking happen?", a: "Fetch a few hundred candidates, score them with a ranking service, return the top N; cache the ranked page briefly." },
    ],
    pitfalls: ["Pure fan-out on write for celebrities", "Offset pagination", "Joining posts and follows at read time at scale"],
    concepts: ["caching", "queues", "sharding", "cap"],
  },
  {
    key: "chat",
    title: "Chat / messaging app",
    level: "Core",
    prompt: "Design a one-to-one and group chat app with delivery receipts and online presence.",
    functional: ["Send and receive messages in real time", "Group chats (up to ~500 members)", "Delivered/read receipts", "Online/last-seen presence", "Message history on any device"],
    nonFunctional: ["Low latency (< 200 ms)", "Messages never lost, in order per conversation", "Works on flaky mobile networks"],
    estimates: ["100M DAU × 40 messages ≈ 4B messages/day ≈ 50K/s", "~100 B each → ~150 TB/year"],
    api: ["WebSocket: send {convId, clientMsgId, text}, ack, deliver", "GET /conversations/{id}/messages?before=…"],
    dataModel: ["messages(conv_id, msg_id (time-ordered), sender_id, body) — partition by conv_id", "conversations / members tables", "connection registry: user_id → gateway server (Redis)"],
    highLevel: ["Clients hold a WebSocket to a gateway server", "Chat service persists the message, then routes it to recipients' gateways via the registry/pub-sub", "Offline recipients get a push notification", "Presence via heartbeats with a TTL"],
    deepDives: [
      { q: "How do you guarantee order and no duplicates?", a: "A per-conversation sequence number or time-ordered ID; clients send a clientMsgId so retries dedupe; clients reorder by sequence." },
      { q: "How do group messages fan out?", a: "Write once to the conversation, then deliver to each online member's gateway; for large groups, fan out asynchronously through a queue." },
      { q: "Which database?", a: "Write-heavy and read by conversation + time → a wide-column store (Cassandra/HBase) partitioned by conv_id." },
    ],
    pitfalls: ["HTTP polling for real-time chat", "Forgetting how a message finds the recipient's server", "No offline/push path"],
    concepts: ["realtime", "sql-nosql", "queues", "idempotency"],
  },
  {
    key: "typeahead",
    title: "Search autocomplete",
    level: "Core",
    prompt: "Design the suggestions that appear as a user types into a search box.",
    functional: ["Return the top 5–10 completions for a prefix", "Rank by popularity (optionally personalised)", "Update with trending queries"],
    nonFunctional: ["< 100 ms per keystroke", "Very high read volume", "Suggestions can lag reality by minutes"],
    estimates: ["10M DAU × 10 searches × ~6 keystrokes ≈ 7K requests/s (×3 at peak)", "Top 10M queries fit in memory"],
    api: ["GET /suggest?q=prefix&limit=10"],
    dataModel: ["Trie (or prefix → top-K list) built offline from query logs", "Query logs in a data warehouse"],
    highLevel: ["Suggest service serves from an in-memory trie with top-K cached at each node", "Offline job aggregates logs (hourly) and rebuilds the trie", "Browser debounces keystrokes and caches results; CDN caches common prefixes"],
    deepDives: [
      { q: "Why store top-K at each node?", a: "Walking the subtree on every keystroke is too slow; precomputing top-K makes each lookup O(prefix length)." },
      { q: "How do updates roll out?", a: "Build a new trie offline, then swap it in atomically on each server (blue/green); trending terms can come from a small real-time layer merged at query time." },
      { q: "How do you scale it?", a: "Replicate the whole trie per server if it fits; otherwise shard by prefix range." },
    ],
    pitfalls: ["Querying the main database on every keystroke", "No debouncing on the client", "Updating the trie in place under load"],
    concepts: ["caching", "cdn", "sharding"],
  },
  {
    key: "video",
    title: "Video streaming platform",
    level: "Advanced",
    prompt: "Design a video platform where users upload videos and millions stream them.",
    functional: ["Upload videos", "Stream on any device at adaptive quality", "Search and view metadata", "View counts"],
    nonFunctional: ["Smooth playback worldwide (low start time, little buffering)", "Uploads never lost", "Very high read:write ratio"],
    estimates: ["500 hours uploaded per minute", "1B views/day ≈ 12K starts/s", "Bandwidth dominates: served by CDN"],
    api: ["POST /videos → pre-signed upload URL", "GET /videos/{id} → metadata + manifest URL", "GET /videos/{id}/manifest.m3u8"],
    dataModel: ["videos(id, owner_id, title, status, manifest_key)", "Raw and transcoded files in object storage", "View counts in a counter service"],
    highLevel: ["Client uploads directly to object storage (resumable, chunked)", "Upload event → queue → transcoding workers produce multiple resolutions in 2–10 s segments", "Manifests + segments served through a CDN (HLS/DASH)", "Metadata service + search index"],
    deepDives: [
      { q: "How does adaptive bitrate work?", a: "Each video is cut into short segments at several bitrates; the player picks the next segment's quality based on measured bandwidth." },
      { q: "How do you transcode fast?", a: "Split the video into chunks and transcode them in parallel on a worker fleet; a workflow tracks completion." },
      { q: "How do you count views at this scale?", a: "Batch increments: buffer in memory/stream, aggregate, then write — approximate is acceptable for display." },
    ],
    pitfalls: ["Streaming video from your own servers instead of a CDN", "Uploading through API servers", "Synchronous transcoding"],
    concepts: ["cdn", "storage", "queues"],
  },
  {
    key: "ride-hailing",
    title: "Ride-hailing dispatch",
    level: "Advanced",
    prompt: "Design the system that matches riders with nearby drivers in real time.",
    functional: ["Drivers send live location", "Rider requests a ride and sees nearby drivers", "Match a rider to a driver; driver accepts", "Track the trip live"],
    nonFunctional: ["Matching in a few seconds", "Location updates every ~4 s from millions of drivers", "A driver is never double-booked"],
    estimates: ["5M active drivers / 4 s ≈ 1.25M location writes/s", "Locations are ephemeral — keep only the latest in memory"],
    api: ["WS/HTTP: PUT /drivers/{id}/location {lat, lng}", "POST /rides {pickup, dropoff}", "POST /rides/{id}/accept"],
    dataModel: ["Driver locations in an in-memory geo index (geohash/H3 cells → driver ids)", "rides(id, rider_id, driver_id, status, …) in a transactional DB"],
    highLevel: ["Location service updates the geo index (sharded by region/cell)", "Matching service queries nearby cells, ranks drivers by ETA, offers the ride", "Trip state machine in a strongly consistent store", "Real-time updates to rider and driver over WebSockets"],
    deepDives: [
      { q: "How do you find nearby drivers fast?", a: "Bucket positions into geohash/H3 cells; search the rider's cell and neighbours; expand rings if too few drivers." },
      { q: "How do you avoid double-booking?", a: "Lock/assign a driver with a conditional write (compare-and-set on driver status) or a short lease; only one offer per driver at a time." },
      { q: "How do you handle 1M+ writes/s?", a: "Keep only the latest position in memory (Redis/geo index), shard by region, and drop stale updates; don't write each ping to a durable DB." },
    ],
    pitfalls: ["Storing every location ping in SQL", "Scanning all drivers to find nearby ones", "No concurrency control on assignment"],
    concepts: ["sharding", "realtime", "cap", "caching"],
  },
];

export const LEVEL_ORDER: DesignProblem["level"][] = ["Starter", "Core", "Advanced"];

/** Back-of-envelope calculator. */
export interface EstimateInput {
  dau: number;
  actionsPerUser: number;
  readRatio: number;
  bytesPerItem: number;
  years: number;
}

export interface EstimateOutput {
  writesPerSec: number;
  readsPerSec: number;
  peakReadsPerSec: number;
  storagePerDay: number;
  storageTotal: number;
  readBandwidth: number;
}

export function estimate(i: EstimateInput): EstimateOutput {
  const writesPerDay = i.dau * i.actionsPerUser;
  const writesPerSec = writesPerDay / 86_400;
  const readsPerSec = writesPerSec * i.readRatio;
  const storagePerDay = writesPerDay * i.bytesPerItem;
  return {
    writesPerSec,
    readsPerSec,
    peakReadsPerSec: readsPerSec * 3,
    storagePerDay,
    storageTotal: storagePerDay * 365 * i.years,
    readBandwidth: readsPerSec * i.bytesPerItem,
  };
}

export function fmtNum(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return n >= 10 ? Math.round(n).toString() : n.toFixed(1);
}

export function fmtBytes(n: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let u = 0;
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000;
    u++;
  }
  return `${n >= 100 ? Math.round(n) : n.toFixed(1)} ${units[u]}`;
}
