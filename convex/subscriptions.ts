import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getSubscriptions without authentication.");
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return subscriptions;
  },
});

export const addSubscription = mutation({
  args: {
    channelName: v.string(),
    channelUrl: v.string(),
    channelLogo: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called addSubscription without authentication.");
    }

    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: identity.subject,
      channelName: args.channelName,
      channelUrl: args.channelUrl,
      channelLogo: args.channelLogo,
    });

    return subscriptionId;
  },
});

export const deleteSubscription = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called deleteSubscription without authentication.");
    }

    const subscription = await ctx.db.get(args.id);
    if (subscription && subscription.userId !== identity.subject) {
      throw new Error("User does not have permission to delete this subscription.");
    }

    await ctx.db.delete(args.id);
  },
});
