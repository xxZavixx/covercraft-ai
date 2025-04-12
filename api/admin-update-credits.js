// /api/admin-update-credits.js

import * as admin from "firebase-admin";
import { Buffer } from "buffer";

// Initialize Firebase Admin once
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

  const { email, add, set } = req.body;

  if (!email || (!add && !set && add !== 0 && set !== 0)) {
    return res.status(400).json({ error: "Missing email and either add or set value." });
  }

  try {
    const docRef = db.collection("buyers").doc(email.toLowerCase());
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    let updatedCredits;

    if (typeof add === "number") {
      const current = doc.data()?.credits || 0;
      updatedCredits = current + add;
    } else if (typeof set === "number") {
      updatedCredits = set;
    } else {
      return res.status(400).json({ error: "Invalid request. Provide 'add' or 'set' as a number." });
    }

    await docRef.update({ credits: updatedCredits });

    return res.status(200).json({
      success: true,
      credits: updatedCredits,
      message: `User now has ${updatedCredits} credits.`,
    });
  } catch (error) {
    console.error("Admin update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}