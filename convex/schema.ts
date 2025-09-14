import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  subscriptions: defineTable({
    userId: v.string(),
    channelId: v.string(),
    channelName: v.string(),
    channelLogoUrl: v.string(),
    channelUrl: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    lastSyncedAt: v.optional(v.string()),
  })
    .index('by_user_channel', ['userId', 'channelId'])
    .index('by_user_created', ['userId', 'createdAt']),

  settings: defineTable({
    userId: v.string(),
    per_page: v.number(),
    per_channel: v.number(),
    showThumbnails: v.boolean(),
    showDescriptions: v.boolean(),
    defaultFeedType: v.union(v.literal('all'), v.literal('video'), v.literal('short')),
    sortOrder: v.union(v.literal('newest'), v.literal('oldest')),
    caching_ttl: v.number(),
    concurrency: v.number(),
    lastSyncedAt: v.optional(v.string()),
  }).index('by_user', ['userId']),

  syncQueue: defineTable({
    userId: v.string(),
    operation: v.union(v.literal('create'), v.literal('update'), v.literal('delete')),
    entityType: v.union(v.literal('subscription'), v.literal('setting')),
    entityId: v.string(),
    data: v.any(),
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index('by_user_created', ['userId', 'createdAt'])
    .index('by_user_processed', ['userId', 'processedAt']),
});
