import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Development-only mutation to add sample subscriptions without authentication
// This should only be used for development/testing purposes
export const addDevSubscription = mutation({
  args: {
    channelId: v.string(),
    channelName: v.string(),
    channelLogoUrl: v.string(),
    channelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Use a fixed development user ID
    const devUserId = 'dev-user-id';

    const existingSubscription = await ctx.db
      .query('subscriptions')
      .filter(q =>
        q.and(q.eq(q.field('userId'), devUserId), q.eq(q.field('channelId'), args.channelId))
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
      userId: devUserId,
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

// Development-only query to get all subscriptions (for testing)
export const getDevSubscriptions = query({
  args: {},
  handler: async ctx => {
    const devUserId = 'dev-user-id';
    return await ctx.db
      .query('subscriptions')
      .filter(q => q.eq(q.field('userId'), devUserId))
      .order('desc')
      .collect();
  },
});

// Development-only mutation to clear all subscriptions
export const clearDevSubscriptions = mutation({
  args: {},
  handler: async ctx => {
    const devUserId = 'dev-user-id';
    const subscriptions = await ctx.db
      .query('subscriptions')
      .filter(q => q.eq(q.field('userId'), devUserId))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }

    return { deleted: subscriptions.length };
  },
});
