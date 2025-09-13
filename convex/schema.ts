import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subscriptions: defineTable({
    userId: v.string(),
    channelName: v.string(),
    channelUrl: v.string(),
    channelLogo: v.string(),
  }).index("by_user", ["userId"]),
});
