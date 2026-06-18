"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  User,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const supabase = createClient();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function fillRole(mail: string, pass: string) {
    setEmail(mail);

    setPassword(pass);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Attempt Sign In
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 2. Fetch User Profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profileError || !profile) {
      setError("Could not load user profile.");
      return;
    }

    // 3. Dynamic Routing based on Role
    router.refresh();

    switch (profile.role) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "manager":
        router.push("/manager/dashboard");
        break;
      case "employee":
        router.push("/employee/dashboard");
        break;
      default:
        router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-10">
        {/* LEFT */}

        <div className="hidden w-[45%] rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 p-14 text-white lg:block">
          <div>
            <h1 className="text-6xl font-black">OMP</h1>

            <p className="mt-6 text-xl">Goal Setting & Tracking Portal</p>
          </div>

          <div className="mt-16 space-y-6">
            <Feature text="Goal Setting" />

            <Feature text="Quarterly Check-ins" />

            <Feature text="Manager Reviews" />

            <Feature text="Audit Ready" />
          </div>
        </div>

        {/* RIGHT */}

        <div className="w-full max-w-xl rounded-[40px] bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-bold">Welcome Back</h2>

          <p className="mt-2 text-gray-500">Sign in to continue</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border p-4"
            />

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border p-4"
              />

              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-5 top-4"
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-blue-600 p-4 font-bold text-white"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2" />
                </>
              )}
            </button>
          </form>

          {/* DEMO */}

          <div className="mt-10">
            <h3 className="mb-4 text-sm font-bold text-gray-500">
              QUICK ACCESS
            </h3>

            <div className="space-y-3">
              <Role
                icon={<User />}
                title="Employee"
                email="employee1@company.com"
                password="Employee1@123"
                fill={fillRole}
              />

              <Role
                icon={<Briefcase />}
                title="Manager"
                email="manager1@company.com"
                password="Manager@123"
                fill={fillRole}
              />

              <Role
                icon={<ShieldCheck />}
                title="Admin"
                email="admin@company.com"
                password="Admin@123"
                fill={fillRole}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Role({
  icon,

  title,

  email,

  password,

  fill,
}: any) {
  return (
    <button
      onClick={() => fill(email, password)}
      className="flex w-full items-center rounded-2xl border p-4 text-left hover:bg-slate-50"
    >
      <div className="mr-4 rounded-xl bg-blue-50 p-3">{icon}</div>

      <div className="flex-1">
        <div className="font-bold">{title}</div>

        <div className="text-sm text-gray-500">{email}</div>
      </div>

      <div className="text-xs text-blue-600">Tap</div>
    </button>
  );
}

function Feature({ text }: any) {
  return <div className="rounded-2xl bg-white/10 p-5">✓ {text}</div>;
}
