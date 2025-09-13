import { readFileSync, writeFileSync } from 'fs';

// Read the sample subscriptions data
const sampleSubscriptions = JSON.parse(
  readFileSync('./data/subscriptions.json', 'utf8')
);

// Transform the data to match Convex schema
const transformedSubscriptions = sampleSubscriptions.map(sub => ({
  userId: 'sample-user-id', // This would normally come from authentication
  channelId: sub.id,
  channelName: sub.title,
  channelLogoUrl: `https://picsum.photos/seed/${sub.id}/100/100.jpg`, // Placeholder logo
  channelUrl: sub.url,
  createdAt: sub.created_at,
  lastSyncedAt: new Date().toISOString(),
}));

console.log('Transformed subscriptions:', transformedSubscriptions);
console.log('Total subscriptions to migrate:', transformedSubscriptions.length);

// Save the transformed data for manual import
writeFileSync(
  './data/transformed-subscriptions.json', 
  JSON.stringify(transformedSubscriptions, null, 2)
);

console.log('Transformed data saved to data/transformed-subscriptions.json');

// Generate individual commands for each subscription
console.log('\n=== Individual commands to add subscriptions ===');
transformedSubscriptions.forEach((sub) => {
  console.log(`npx convex run subscriptions:addSubscription --args '${JSON.stringify({
    channelId: sub.channelId,
    channelName: sub.channelName,
    channelLogoUrl: sub.channelLogoUrl,
    channelUrl: sub.channelUrl,
  }).replace(/"/g, '\\"')}'`);
});