"use client";

import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  async function testConnection() {
    const supabase = createClient();

    const {
      data,
      error,
    } = await supabase.auth.getSession();

    console.log(data);
    console.log(error);

    alert("Check console");
  }

  return (
    <div className="p-10">
      <button
        onClick={testConnection}
        className="bg-black px-4 py-2 text-white rounded"
      >
        Test Supabase
      </button>
    </div>
  );
}