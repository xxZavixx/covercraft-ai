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
    const docRef = db.collection("buyers").doc(email);
    const doc = await docRef.get();

    let currentCredits = 2; // Default to 2 free credits if doc doesn't exist

    if (doc.exists) {
      currentCredits = doc.data()?.credits ?? 0;
    }

    if (currentCredits > 0) {
      await docRef.set(
        {
          credits: currentCredits - 1,
        },
        { merge: true }
      );

      console.log(`✅ 1 credit used for ${email}. Remaining: ${currentCredits - 1}`);
      return res.status(200).json({ success: true, remaining: currentCredits - 1 });
    } else {
      console.warn(`❌ No credits left for ${email}`);
      return res.status(403).json({ error: "No credits remaining" });
    }
  } catch (error) {
    console.error("❌ Error using credit:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}