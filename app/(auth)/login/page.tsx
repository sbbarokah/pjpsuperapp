"use client";

import { EmailIcon, PasswordIcon } from "@/assets/icons";
import Link from "next/link";
import React, { useState } from "react";

import Image from "next/image";
import InputGroup from "@/components/forms/InputGroup";
import { Checkbox } from "@/components/forms/checkbox";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogoWTitle } from "@/components/ui/logo_title";

export default function SignIn() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null); // State untuk pesan error
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset error setiap kali submit

    // Gunakan Supabase auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError(signInError.message); // Tampilkan pesan error dari Supabase
      setLoading(false);
    } else {
      // Sukses login
      router.push("/"); // Ganti dengan rute tujuan Anda
      router.refresh();
    }
  };

  return (
    <>
      <div className="rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full p-7.5 xl:block xl:w-1/2">
            <div className="custom-gradient-1 overflow-hidden rounded-2xl px-12.5 pt-12.5 dark:!bg-dark-2 dark:bg-none">
              <Link className="mb-10 inline-block" href="/">
                {/* <Image
                  className="hidden dark:block"
                  src={"/images/logo/logo.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={"/images/logo/logo-dark.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                /> */}
                {/* <Image
                  src={"/images/logo/pjp_logo_clean.png"}
                  alt="Logo"
                  width={50}
                  height={50}
                /> */}
                <LogoWTitle />
              </Link>
              <p className="mb-3 text-xl font-medium text-dark dark:text-white">
                Assalaamu'alaikum...
              </p>

              {/* <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
                Assalaamu'alaikum...
              </h1> */}

              <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
                Silahkan masuk dengan email dan kata sandi Anda
              </p>

              <div className="mt-31">
                <Image
                  src={"/images/grids/grid-02.svg"}
                  alt="Logo"
                  width={405}
                  height={325}
                  className="mx-auto dark:opacity-30"
                />
              </div>
            </div>
          </div>

          <div className="w-full xl:w-1/2">
            <div className="block p-4 sm:p-12.5 xl:hidden">
              <Link className="mb-10 block flex w-full justify-center" href="/">
                {/* <Image
                  className="hidden dark:block"
                  src={"/images/logo/logo.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={"/images/logo/logo-dark.svg"}
                  alt="Logo"
                  width={176}
                  height={32}
                /> */}
                <Image
                  src={"/images/logo/pjp_logo_clean.png"}
                  alt="Logo"
                  width={50}
                  height={50}
                />
              </Link>
            </div>
            <div className="w-full p-4 sm:p-12.5 xl:p-10">
              <form onSubmit={handleSubmit}>
                <InputGroup
                  type="email"
                  label="Email"
                  className="mb-4 [&_input]:py-[15px]"
                  placeholder="Enter your email"
                  name="email"
                  handleChange={handleChange}
                  value={data.email}
                  icon={<EmailIcon />}
                />

                <InputGroup
                  type="password"
                  label="Password"
                  className="mb-5 [&_input]:py-[15px]"
                  placeholder="Enter your password"
                  name="password"
                  handleChange={handleChange}
                  value={data.password}
                  icon={<PasswordIcon />}
                />

                <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
                  <Checkbox
                    label="Remember me"
                    name="remember"
                    withIcon="check"
                    minimal
                    radius="md"
                    onChange={(e) =>
                      setData({
                        ...data,
                        remember: e.target.checked,
                      })
                    }
                  />

                  {/* <Link
                    href="/auth/forgot-password"
                    className="hover:text-primary dark:text-white dark:hover:text-primary"
                  >
                    Forgot Password?
                  </Link> */}
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
                    {error}
                  </div>
                )}

                <div className="mb-4.5">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
                  >
                    Sign In
                    {loading && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
