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
    const doc = await db.collection("buyers").doc(email).get();

    // Default to 2 free credits if user not found
    const credits = doc.exists ? doc.data()?.credits || 0 : 2;

    return res.status(200).json({ credits });
  } catch (error) {
    console.error("❌ Error checking credits:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}