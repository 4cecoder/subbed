import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getSettings = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const settings = await ctx.db
      .query('settings')
      .filter(q => q.eq(q.field('userId'), identity.subject))
      .first();

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    per_page: v.optional(v.number()),
    per_channel: v.optional(v.number()),
    showThumbnails: v.optional(v.boolean()),
    showDescriptions: v.optional(v.boolean()),
    defaultFeedType: v.optional(v.union(v.literal('all'), v.literal('video'), v.literal('short'))),
    sortOrder: v.optional(v.union(v.literal('newest'), v.literal('oldest'))),
    caching_ttl: v.optional(v.number()),
    concurrency: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existingSettings = await ctx.db
      .query('settings')
      .filter(q => q.eq(q.field('userId'), identity.subject))
      .first();

    const updateData = {
      ...args,
      lastSyncedAt: new Date().toISOString(),
    };

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, updateData);
      return existingSettings._id;
    }

    const defaultSettings = {
      per_page: 20,
      per_channel: 10,
      showThumbnails: true,
      showDescriptions: true,
      defaultFeedType: 'all' as const,
      sortOrder: 'newest' as const,
      caching_ttl: 0,
      concurrency: 6,
    };

    const settingsId = await ctx.db.insert('settings', {
      userId: identity.subject,
      ...defaultSettings,
      ...updateData,
      lastSyncedAt: new Date().toISOString(),
    });

    return settingsId;
  },
});

export const syncSettings = mutation({
  args: {
    per_page: v.number(),
    per_channel: v.number(),
    showThumbnails: v.boolean(),
    showDescriptions: v.boolean(),
    defaultFeedType: v.union(v.literal('all'), v.literal('video'), v.literal('short')),
    sortOrder: v.union(v.literal('newest'), v.literal('oldest')),
    caching_ttl: v.number(),
    concurrency: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existingSettings = await ctx.db
      .query('settings')
      .filter(q => q.eq(q.field('userId'), identity.subject))
      .first();

    const updateData = {
      ...args,
      lastSyncedAt: new Date().toISOString(),
    };

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, updateData);
      return existingSettings._id;
    }

    const settingsId = await ctx.db.insert('settings', {
      userId: identity.subject,
      ...updateData,
      lastSyncedAt: new Date().toISOString(),
    });

    return settingsId;
  },
});
