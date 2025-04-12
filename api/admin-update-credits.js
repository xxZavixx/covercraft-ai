// /api/admin-update-credits.js

import * as admin from "firebase-admin";
import { Buffer } from "buffer";

// Initialize Firebase Admin if not already done
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
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  const { email, action, value } = req.body;

  if (!email || !action || typeof value !== "number") {
    return res.status(400).json({ error: "Missing email, action, or value" });
  }

  const docRef = db.collection("buyers").doc(email.toLowerCase());
  const doc = await docRef.get();

  if (!doc.exists) {
    return res.status(404).json({ error: "Buyer not found" });
  }

  const current = doc.data()?.credits || 0;
  let updatedCredits;

  if (action === "add") {
    updatedCredits = current + value;
  } else if (action === "set") {
    updatedCredits = value;
  } else {
    return res.status(400).json({ error: "Invalid action. Use 'add' or 'set'" });
  }

  await docRef.update({ credits: updatedCredits });

  return res.status(200).json({ success: true, credits: updatedCredits });
}
