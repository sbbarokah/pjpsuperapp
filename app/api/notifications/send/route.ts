// app/api/notifications/send/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { createClient } from "@/lib/supabase/server_user"; // Digunakan hanya untuk verifikasi sesi pengirim
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // Digunakan untuk bypass RLS

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

// Inisialisasi Supabase Admin dengan Service Role (Bypass RLS secara aman di server side)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { targetUserId, title, body, targetPath } = await request.json();

    // 1. Verifikasi bahwa pengirim memiliki sesi aktif di aplikasi (opsional namun krusial untuk keamanan)
    const supabaseUserClient = await createClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sesi pengirim tidak valid. Akses ditolak." }, { status: 401 });
    }

    // 2. Ambil token FCM dari Supabase menggunakan 'supabaseAdmin' (Melompati filter RLS)
    const { data: devices, error: dbError } = await supabaseAdmin
      .from("user_devices")
      .select("fcm_token")
      .eq("user_id", targetUserId);

    // console.log("=== PROSES KIRIM NOTIFIKASI ===");
    // console.log("Pengirim (Admin ID):", user.id);
    // console.log("Target Penerima (User ID):", targetUserId);
    // console.log("Hasil Pemindaian Token:", devices);
    // if (dbError) console.error("Database Error:", dbError);

    if (dbError || !devices || devices.length === 0) {
      return NextResponse.json({ 
        message: "User tidak memiliki perangkat mobile yang aktif.",
        debug: { targetUserId, foundCount: devices?.length || 0 }
      }, { status: 404 });
    }

    // 3. Ekstrak token menjadi array string
    const registrationTokens = devices.map((d) => d.fcm_token);

    // 4. Susun struktur pesan FCM (menggunakan HTTP v1 format bawaan firebase-admin)
    const message = {
      // Payload dasar
      notification: { 
        title, 
        body 
      },
      data: {
        target_path: targetPath || "/", // Data tambahan untuk dibaca aplikasi mobile Anda
      },
      
      // Konfigurasi Khusus Android (Wajib untuk menampilkan Banner / Pop-up)
      android: {
        priority: "high" as const, // Memaksa notifikasi langsung dikirim tanpa ditunda OS
        notification: {
          channelId: "pjp_superapp_channel", // WAJIB cocok dengan channel ID yang dibuat di aplikasi mobile
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK", // Sangat penting jika menggunakan Flutter/React Native
          visibility: "public" as const,
        }
      },
      
      // Konfigurasi Khusus iOS / APNs (Apple Push Notification service)
      // apns: {
      //   headers: {
      //     "apns-priority": "10", // Prioritas tinggi untuk iOS
      //   },
      //   payload: {
      //     aps: {
      //       alert: {
      //         title,
      //         body
      //       },
      //       sound: "default",
      //       badge: 1,
      //       contentAvailable: true // Mengizinkan background fetch di iOS
      //     }
      //   }
      // },
      
      tokens: registrationTokens,
    };

    // 5. Tembakkan ke Firebase Cloud Messaging
    const response = await admin.messaging().sendEachForMulticast(message);
    
    // ===================================================================
    // LOG TAMBAHAN UNTUK DIAGNOSIS (SANGAT PENTING)
    // ===================================================================
    // console.log("=== CEK ENV AKTIF ===");
    // console.log("Project ID Terbaca:", process.env.FIREBASE_PROJECT_ID);
    // console.log("Email Kunci Terbaca:", process.env.FIREBASE_CLIENT_EMAIL);
    // console.log("=====================");
    // console.log("=== DETAIL RESPONS FIREBASE ===");
    // console.log(`Sukses: ${response.successCount}, Gagal: ${response.failureCount}`);
    
    // Jika ada token yang gagal, cetak alasan error-nya dari Firebase
    if (response.failureCount > 0) {
      response.responses.forEach((res, index) => {
        if (!res.success) {
          console.error(`Token indeks ke-${index} Gagal. Error dari Firebase:`, res.error?.toJSON());
        }
      });
    }
    console.log("===============================");

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}