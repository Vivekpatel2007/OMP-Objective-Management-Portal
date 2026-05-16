"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/services/authservice";
import { getProfile } from "@/services/profileservice";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await login(email, password);

    if (error) {
      alert(error.message);
      return;
    }
  const userId = data.user?.id;

  if (!userId) {
    alert("User not found");
    return;
  }

  const profileResponse = await getProfile(userId);

    if (!profileResponse.data) {
      alert("Profile not found");
      return;
    }

    const role = profileResponse.data.role;

    if (role === "employee") {
      router.push("/employee/dashboard");
    } else if (role === "manager") {
      router.push("/manager/dashboard");
    } else if (role === "admin") {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-lg border p-6 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-4 w-full rounded border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full rounded bg-black p-2 text-white"
        >
          Login
        </button>
      </form>
    </div>
  );
}