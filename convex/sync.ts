import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPendingSyncOperations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    return await ctx.db
      .query("syncQueue")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("processedAt"), undefined)
        )
      )
      .order("asc")
      .collect();
  },
});

export const addToSyncQueue = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
    entityType: v.union(v.literal("subscription"), v.literal("setting")),
    entityId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    await ctx.db.insert("syncQueue", {
      userId: identity.subject,
      operation: args.operation,
      entityType: args.entityType,
      entityId: args.entityId,
      data: args.data,
      createdAt: new Date().toISOString(),
    });
  },
});

export const markSyncOperationProcessed = mutation({
  args: { syncId: v.id("syncQueue") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const syncOperation = await ctx.db.get(args.syncId);
    if (!syncOperation || syncOperation.userId !== identity.subject) {
      throw new Error("Sync operation not found or access denied");
    }
    
    await ctx.db.patch(args.syncId, {
      processedAt: new Date().toISOString(),
    });
  },
});

export const markSyncOperationError = mutation({
  args: { 
    syncId: v.id("syncQueue"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const syncOperation = await ctx.db.get(args.syncId);
    if (!syncOperation || syncOperation.userId !== identity.subject) {
      throw new Error("Sync operation not found or access denied");
    }
    
    await ctx.db.patch(args.syncId, {
      error: args.error,
    });
  },
});

export const clearProcessedSyncOperations = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const processedOperations = await ctx.db
      .query("syncQueue")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.neq(q.field("processedAt"), undefined)
        )
      )
      .collect();
    
    for (const operation of processedOperations) {
      await ctx.db.delete(operation._id);
    }
  },
});