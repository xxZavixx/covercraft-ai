// /api/check-credits.js

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
  const email = req.query.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const userRef = db.collection("buyers").doc(email);
    const userDoc = await userRef.get();

    // If buyer record exists, return their credit count
    if (userDoc.exists) {
      const credits = userDoc.data()?.credits ?? 0;
      return res.status(200).json({ credits });
    }

    // If not found, return 2 free credits by default
    return res.status(200).json({ credits: 2 });
  } catch (error) {
    console.error("❌ Firestore credit check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}