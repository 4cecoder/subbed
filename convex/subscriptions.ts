import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getSubscriptions = query({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query('subscriptions')
      .filter(q => q.eq(q.field('userId'), identity.subject))
      .order('desc')
      .collect();
  },
});

export const addSubscription = mutation({
  args: {
    channelId: v.string(),
    channelName: v.string(),
    channelLogoUrl: v.string(),
    channelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existingSubscription = await ctx.db
      .query('subscriptions')
      .filter(q =>
        q.and(q.eq(q.field('userId'), identity.subject), q.eq(q.field('channelId'), args.channelId))
      )
      .first();

    if (existingSubscription) {
      // Update existing subscription
      await ctx.db.patch(existingSubscription._id, {
        channelName: args.channelName,
        channelLogoUrl: args.channelLogoUrl,
        channelUrl: args.channelUrl,
        lastSyncedAt: new Date().toISOString(),
      });
      return existingSubscription._id;
    }

    // Create new subscription
    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: identity.subject,
      channelId: args.channelId,
      channelName: args.channelName,
      channelLogoUrl: args.channelLogoUrl,
      channelUrl: args.channelUrl,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    });

    return subscriptionId;
  },
});

export const removeSubscription = mutation({
  args: { channelId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const subscription = await ctx.db
      .query('subscriptions')
      .filter(q =>
        q.and(q.eq(q.field('userId'), identity.subject), q.eq(q.field('channelId'), args.channelId))
      )
      .first();

    if (!subscription) {
      return;
    }

    await ctx.db.delete(subscription._id);
  },
});

export const clearSubscriptions = mutation({
  args: {},
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const subscriptions = await ctx.db
      .query('subscriptions')
      .filter(q => q.eq(q.field('userId'), identity.subject))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }
  },
});

export const syncSubscription = mutation({
  args: {
    channelId: v.string(),
    channelName: v.string(),
    channelLogoUrl: v.string(),
    channelUrl: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const existingSubscription = await ctx.db
      .query('subscriptions')
      .filter(q =>
        q.and(q.eq(q.field('userId'), identity.subject), q.eq(q.field('channelId'), args.channelId))
      )
      .first();

    if (existingSubscription) {
      await ctx.db.patch(existingSubscription._id, {
        channelName: args.channelName,
        channelLogoUrl: args.channelLogoUrl,
        channelUrl: args.channelUrl,
        lastSyncedAt: new Date().toISOString(),
      });
      return existingSubscription._id;
    }

    const subscriptionId = await ctx.db.insert('subscriptions', {
      userId: identity.subject,
      channelId: args.channelId,
      channelName: args.channelName,
      channelLogoUrl: args.channelLogoUrl,
      channelUrl: args.channelUrl,
      createdAt: args.createdAt,
      lastSyncedAt: new Date().toISOString(),
    });

    return subscriptionId;
  },
});
