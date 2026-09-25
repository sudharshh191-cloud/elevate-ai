import { ISystemDesignProblem } from '../types';

export const SYSTEM_DESIGN_PROBLEMS: ISystemDesignProblem[] = [
  {
    id: 'url-shortener',
    title: 'Design a High-Scale URL Shortener (TinyURL)',
    difficulty: 'Senior',
    category: 'Distributed Key-Value & Caching',
    description:
      'Architect a distributed URL shortening service capable of creating compact aliases for long URLs and handling high-volume HTTP redirects with ultra-low latency.',
    expectedScale: '100M URLs created/month • 10 Billion redirects/month • 10:1 Read-to-Write Ratio',
    functionalRequirements: [
      'Generate a unique 7-character Base62 alias for any valid long URL.',
      'Redirect users accessing short URL aliases with HTTP 301/302 to the original destination.',
      'Allow custom alias specification and configurable expiration timestamps.',
      'Expose public REST API endpoints for link creation and basic access telemetry.',
    ],
    nonFunctionalRequirements: [
      'P99 redirect latency under 15ms.',
      'High availability (99.99% uptime) with zero single points of failure.',
      'Read-heavy optimization via distributed memory caching (Redis/Memcached).',
      'Idempotent alias generation preventing duplicate collisions.',
    ],
    trafficAssumptions: {
      dau: 25000000,
      requestsPerUser: 12,
      peakMultiplier: 2.5,
      readWriteRatio: 10,
      payloadSizeKb: 0.5,
    },
  },
  {
    id: 'instagram-feed',
    title: 'Design an Instagram-like Personalized Newsfeed',
    difficulty: 'Staff',
    category: 'Fan-Out & Content Delivery',
    description:
      'Design a scalable social media feed service supporting real-time photo/video posting, follower relationship graphs, and sub-200ms personalized feed generation for hundreds of millions of users.',
    expectedScale: '500M Daily Active Users • 2 Billion photo posts/day • 50:1 Read-to-Write Ratio',
    functionalRequirements: [
      'Users can publish photos/videos with captions and metadata.',
      'Users can follow other accounts and maintain bidirectional friendship/follower graphs.',
      'Generate personalized ranked chronological home feeds in real time.',
      'Support celebrity/high-follower accounts with hybrid push/pull fan-out models.',
    ],
    nonFunctionalRequirements: [
      'Home feed generation latency P95 < 200ms.',
      'Eventual consistency acceptable for feed updates (up to 5s delivery lag).',
      'High media delivery availability via Global Edge CDNs and Object Storage (S3).',
      'Graceful degradation when ranking and ML inference microservices experience load spikes.',
    ],
    trafficAssumptions: {
      dau: 500000000,
      requestsPerUser: 30,
      peakMultiplier: 2.2,
      readWriteRatio: 50,
      payloadSizeKb: 4.0,
    },
  },
  {
    id: 'food-delivery',
    title: 'Design a Real-Time Food Delivery Platform (DoorDash)',
    difficulty: 'Senior',
    category: 'Geospatial Dispatch & Order Lifecycle',
    description:
      'Design an end-to-end food delivery orchestration system connecting customers, restaurant merchant tablets, and delivery drivers with live GPS tracking and atomic payment settlement.',
    expectedScale: '20M DAU • 5M Orders placed/day • 500,000 active couriers during lunch/dinner spikes',
    functionalRequirements: [
      'Customers can browse restaurant menus, customize items, and place checkout orders.',
      'Restaurant POS receiving real-time order acceptance webhooks.',
      'Intelligent driver batching and dispatch matching algorithms based on location and ETAs.',
      'Live driver route tracking streamed to customer mobile apps.',
    ],
    nonFunctionalRequirements: [
      'Strict ACID transaction guarantee for order payments, refunds, and promotions.',
      'Sub-second driver geospatial index updates (Redis Geospatial / QuadTree / H3).',
      'High peak resilience to handle 4x load spikes during dinner hours (18:00–21:00).',
    ],
    trafficAssumptions: {
      dau: 20000000,
      requestsPerUser: 15,
      peakMultiplier: 4.0,
      readWriteRatio: 6,
      payloadSizeKb: 2.0,
    },
  },
  {
    id: 'ride-sharing',
    title: 'Design a Global Ride-Sharing Service (Uber/Lyft)',
    difficulty: 'Staff',
    category: 'High-Throughput Geospatial Indexing',
    description:
      'Architect a real-time ride matching and dispatch engine that ingests driver location telemetry every 4 seconds, calculates dynamic surge pricing, and matches riders in under 2 seconds.',
    expectedScale: '50M DAU • 2M Active Drivers • 1M Location Pings per Second',
    functionalRequirements: [
      'Drivers emit GPS location pings every 3–5 seconds to the ingestion cluster.',
      'Riders request rides and get matched with the optimal nearby available driver.',
      'Dynamic surge pricing engine based on supply/demand spatial density.',
      'Real-time trip routing, turn-by-turn ETA recalculation, and fare settlement.',
    ],
    nonFunctionalRequirements: [
      'Driver dispatch response time under 1.5 seconds.',
      'High-write throughput ingestion cluster with zero dropped location telemetry.',
      'High availability across multi-region edge gateways with automated failover.',
    ],
    trafficAssumptions: {
      dau: 50000000,
      requestsPerUser: 25,
      peakMultiplier: 3.5,
      readWriteRatio: 3,
      payloadSizeKb: 1.5,
    },
  },
  {
    id: 'video-streaming',
    title: 'Design a Global Video Streaming Platform (YouTube/Netflix)',
    difficulty: 'Staff',
    category: 'Transcoding Pipelines & Edge CDNs',
    description:
      'Architect a planetary-scale video platform supporting asynchronous ingestion, multi-bitrate transcoding (HLS/DASH), and high-bandwidth edge playback for billions of concurrent viewers.',
    expectedScale: '800M DAU • 500 hours video uploaded/min • 10 Billion video views/day',
    functionalRequirements: [
      'Creators can upload large raw video files asynchronously with resumable uploads.',
      'Distributed worker pipeline transcodes video into multiple resolutions (1080p, 4K, mobile).',
      'Viewers stream video adaptively based on client network bandwidth.',
      'Video metadata, search indexing, likes, comments, and recommendations.',
    ],
    nonFunctionalRequirements: [
      'Near-zero buffering start time (< 500ms initial video segment load).',
      'Multi-terabit egress bandwidth handled seamlessly by multi-tiered CDN edge points.',
      'Petabyte-scale persistent object storage with automated tiered archiving.',
    ],
    trafficAssumptions: {
      dau: 800000000,
      requestsPerUser: 12,
      peakMultiplier: 2.0,
      readWriteRatio: 100,
      payloadSizeKb: 10.0,
    },
  },
  {
    id: 'chat-app',
    title: 'Design a Real-Time Messaging App (WhatsApp/Slack)',
    difficulty: 'Senior',
    category: 'Persistent WebSockets & Distributed Queues',
    description:
      'Design a low-latency, highly available real-time messaging application supporting 1-on-1 chat, group conversations, online/offline presence synchronization, and offline message delivery.',
    expectedScale: '300M DAU • 100 Billion messages delivered/day • 50M concurrent WebSocket connections',
    functionalRequirements: [
      'Instant 1-on-1 direct messaging and multi-user group channels.',
      'Delivery receipts (Sent, Delivered to Device, Read).',
      'Real-time user presence tracking (Online, Away, Last Seen).',
      'Offline message store and push notification triggering when recipient is disconnected.',
    ],
    nonFunctionalRequirements: [
      'Sub-80ms message delivery latency between online clients.',
      'Persistent bi-directional connection management (WebSockets/TCP connection gateways).',
      'End-to-end data encryption and strict at-least-once delivery guarantees.',
    ],
    trafficAssumptions: {
      dau: 300000000,
      requestsPerUser: 80,
      peakMultiplier: 2.8,
      readWriteRatio: 1,
      payloadSizeKb: 0.8,
    },
  },
  {
    id: 'notification-system',
    title: 'Design a Distributed Multi-Channel Notification Engine',
    difficulty: 'Mid',
    category: 'Async Event Driven Architecture',
    description:
      'Architect an enterprise notification service that accepts millions of notification requests and dispatches them reliably across iOS APNS, Android FCM, WebSockets, SMS, and Email.',
    expectedScale: '100M DAU • 1 Billion notifications/day • Multi-channel delivery failover',
    functionalRequirements: [
      'Unified API for backend microservices to send transactional and marketing notifications.',
      'Integration with external providers (APNS, FCM, Twilio, SendGrid, Amazon SES).',
      'User notification preference center (quiet hours, channel opt-outs).',
      'Deduplication and rate limiting (prevent spamming same user within short intervals).',
    ],
    nonFunctionalRequirements: [
      'Prioritized message queues: High-priority (OTP, security alerts) vs Low-priority (newsletters).',
      'Guaranteed at-least-once delivery with exponential backoff and dead-letter queues.',
      'High throughput event streaming (Kafka / AWS SQS / RabbitMQ).',
    ],
    trafficAssumptions: {
      dau: 100000000,
      requestsPerUser: 20,
      peakMultiplier: 3.0,
      readWriteRatio: 1,
      payloadSizeKb: 1.0,
    },
  },
  {
    id: 'ecommerce-platform',
    title: 'Design a Flash-Sale E-Commerce Platform (Amazon/Shopify)',
    difficulty: 'Staff',
    category: 'Distributed Transactions & Flash Inventory',
    description:
      'Design a resilient e-commerce architecture capable of handling viral flash sales with 500,000 requests/sec competing for limited item inventory without overselling or race conditions.',
    expectedScale: '100M Active Shoppers • 1B Catalog Items • 500k QPS during Flash Sale Spikes',
    functionalRequirements: [
      'Fast product catalog browsing, full-text search, and faceted category filtering.',
      'Atomic shopping cart checkout with temporary inventory reservation timeout (10 mins).',
      'Payment gateway orchestration (Stripe, PayPal, Apple Pay).',
      'Order processing state machine and warehouse fulfillment dispatch.',
    ],
    nonFunctionalRequirements: [
      'Zero overselling of flash sale inventory via distributed atomic locks (Redis Lua / DB isolation).',
      'Sub-100ms catalog read latency with multi-layered read caching.',
      'High availability: catalog browsing operational even if payment gateway experiences downtime.',
    ],
    trafficAssumptions: {
      dau: 100000000,
      requestsPerUser: 40,
      peakMultiplier: 5.0,
      readWriteRatio: 20,
      payloadSizeKb: 3.0,
    },
  },
];
