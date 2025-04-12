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
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  const docRef = db.collection("buyers").doc(email);
  const doc = await docRef.get();

  if (doc.exists) {
    const current = doc.data()?.credits || 0;
    if (current > 0) {
      await docRef.update({ credits: current - 1 });
    }
  } else {
    const fallback = 2;
    if (fallback > 0) {
      await docRef.set({ credits: fallback - 1 }, { merge: true });
    }
  }

  res.status(200).json({ success: true });
}
