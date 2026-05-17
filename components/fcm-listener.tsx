'use client';

import { useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";

export default function FcmListener() {
  const supabase = createClient();

  useEffect(() => {
    // 1. Mendefinisikan fungsi global yang akan dipanggil oleh Flutter
    window.receiveFlutterData = async (fcmToken: string, deviceUuid: string) => {
      console.log("Data diterima dari Flutter:", { fcmToken, deviceUuid });

      // 2. Cek apakah user sedang login
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // 3. Simpan ke Supabase (Upsert berdasarkan device_uuid)
        const { error } = await supabase
          .from('user_devices')
          .upsert(
            { 
              user_id: session.user.id, 
              device_uuid: deviceUuid, 
              fcm_token: fcmToken,
              last_active: new Date().toISOString()
            },
            { onConflict: 'device_uuid' } // Penting: Timpa data jika device_uuid sudah ada
          );

        if (error) console.error("Gagal menyimpan FCM Token:", error);
      }
    };

    return () => {
      // Cleanup
      delete window.receiveFlutterData;
    };
  }, [supabase]);

  return null; // Komponen ini tidak me-render UI apa pun
}

// Tambahkan deklarasi TypeScript agar tidak error saat build
declare global {
  interface Window {
    receiveFlutterData?: (fcmToken: string, deviceUuid: string) => Promise<void>;
    FlutterChannel?: {
      postMessage: (message: string) => void;
    };
  }
}