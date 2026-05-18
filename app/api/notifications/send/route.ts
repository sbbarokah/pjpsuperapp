// app/api/send-notification/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { createClient } from "@/lib/supabase/server_user"; // Gunakan server client Anda

// Inisialisasi Firebase Admin (Singleton Pattern agar tidak duplikat)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { targetUserId, title, body, targetPath } = await request.json();
    const supabase = await createClient();

    // 1. Ambil semua token FCM aktif milik user tersebut dari Supabase
    const { data: devices, error: dbError } = await supabase
      .from("user_devices")
      .select("fcm_token")
      .eq("user_id", targetUserId);

    if (dbError || !devices || devices.length === 0) {
      return NextResponse.json({ message: "User tidak memiliki perangkat mobile yang aktif." }, { status: 404 });
    }

    // 2. Ekstrak token menjadi array string
    const registrationTokens = devices.map((d) => d.fcm_token);

    // 3. Susun struktur pesan FCM (menggunakan HTTP v1 format bawaan firebase-admin)
    const message = {
      notification: { title, body },
      data: {
        target_path: targetPath || "/", // Route di Next.js tujuan jika notif di-tap
      },
      tokens: registrationTokens,
    };

    // 4. Tembakkan ke Firebase Cloud Messaging
    const response = await admin.messaging().sendEachForMulticast(message);
    
    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}