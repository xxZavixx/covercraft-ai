// /api/paypal-ipn.js

import * as admin from "firebase-admin";
import fetch from "node-fetch";
import { Buffer } from "buffer";

// Initialize Firebase Admin SDK once
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

  try {
    const rawBody = new URLSearchParams(req.body).toString();

    // Verify IPN with PayPal
    const verifyRes = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `cmd=_notify-validate&${rawBody}`,
    });

    const verifyText = await verifyRes.text();

    if (verifyText !== "VERIFIED") {
      console.error("❌ IPN message not verified.");
      return res.status(400).end("Invalid IPN");
    }

    const {
      payment_status,
      receiver_email,
      payer_email,
      txn_id,
      payer_id,
      first_name,
      last_name,
      mc_gross,
    } = req.body;

    const isCompleted = payment_status === "Completed";
    const isCorrectReceiver = receiver_email === "xzavierharris25@gmail.com";

    if (!isCompleted || !isCorrectReceiver) {
      console.warn("⚠️ IPN ignored: incomplete payment or wrong receiver.");
      return res.status(200).end();
    }

    const email = payer_email?.toLowerCase();
    const txnRef = db.collection("transactions").doc(txn_id);
    const txnSnap = await txnRef.get();

    if (txnSnap.exists) {
      console.log("ℹ️ Duplicate transaction. Already processed.");
      return res.status(200).end();
    }

    const buyerRef = db.collection("buyers").doc(email);
    const buyerSnap = await buyerRef.get();
    const currentCredits = buyerSnap.exists ? buyerSnap.data()?.credits || 0 : 0;

    await buyerRef.set(
      {
        email,
        credits: currentCredits + 15,
        payer_id,
        payer_name: `${first_name} ${last_name}`,
        amount: mc_gross,
        lastPayment: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await txnRef.set({
      email,
      amount: mc_gross,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ ${email} credited with 15 cover letter credits.`);

    res.status(200).end();
  } catch (error) {
    console.error("❌ IPN Handler Error:", error);
    res.status(500).end("Internal server error");
  }
}
