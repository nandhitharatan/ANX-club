import * as admin from 'firebase-admin';
// Run with: npx tsx --env-file=.env.local scripts/backfill-v1-users.ts
// (Node 20+ built-in env loading — no dotenv package needed)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle escaped newlines in the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function backfillUsers() {
  console.log('Starting V1 User Data Backfill...');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  console.log(`Found ${snapshot.size} users. Processing...`);
  
  let updatedCount = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if fields are missing
    if (
      data.xpTotal === undefined ||
      data.leadershipStage === undefined ||
      data.skills === undefined ||
      data.referralCode === undefined
    ) {
      batch.update(doc.ref, {
        xpTotal: data.xpTotal || 0,
        leadershipStage: data.leadershipStage || 'Member',
        skills: data.skills || [],
        referralCode: data.referralCode || `REF_${doc.id.substring(0,8).toUpperCase()}`
      });
      
      updatedCount++;
      batchCount++;
      
      if (batchCount === 500) {
        await batch.commit();
        console.log(`Committed batch of 500 updates...`);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Backfill complete. Updated ${updatedCount} users.`);
}

backfillUsers().catch(console.error);
