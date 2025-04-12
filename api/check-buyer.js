// /api/check-buyer.js

import * as admin from "firebase-admin";
import { Buffer } from "buffer";

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
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const snapshot = await db
      .collection("buyers")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({ found: true });
  } catch (error) {
    console.error("Firestore check error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
