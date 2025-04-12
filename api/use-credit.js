// /api/use-credit.js

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Only POST allowed");
  }

  const email = req.body.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const userRef = db.collection("buyers").doc(email);
    const userDoc = await userRef.get();

    let currentCredits = 2; // fallback to 2 free credits if no record

    if (userDoc.exists) {
      currentCredits = userDoc.data()?.credits ?? 0;
    }

    if (currentCredits > 0) {
      await userRef.set(
        { credits: currentCredits - 1 },
        { merge: true }
      );

      console.log(`✅ ${email} used 1 credit. Remaining: ${currentCredits - 1}`);
      return res.status(200).json({ success: true, remaining: currentCredits - 1 });
    } else {
      console.warn(`❌ ${email} has no credits remaining.`);
      return res.status(403).json({ error: "No credits remaining" });
    }
  } catch (error) {
    console.error("❌ Firestore error using credit:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}