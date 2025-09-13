const { readFileSync } = require('fs');

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
require('fs').writeFileSync(
  './data/transformed-subscriptions.json', 
  JSON.stringify(transformedSubscriptions, null, 2)
);

console.log('Transformed data saved to data/transformed-subscriptions.json');
console.log('Please run: npx convex run subscriptions:addSubscription --args \'{"channelId":"UCr-5TdGkKszdbboXXsFZJTQ","channelName":"Gamefromscratch","channelLogoUrl":"https://picsum.photos/seed/UCr-5TdGkKszdbboXXsFZJTQ/100/100.jpg","channelUrl":"https://www.youtube.com/channel/UCr-5TdGkKszdbboXXsFZJTQ"}\'');