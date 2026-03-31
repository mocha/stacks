"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RelinquishButton({ acronym }: { acronym: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRelinquish = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/${acronym}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmation: "Yeah it sucks these days anyway",
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setLoading(false);
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}>Relinquish</button>
    );
  }

  return (
    <div>
      <p>Are you sure?</p>
      <button onClick={handleRelinquish} disabled={loading}>
        {loading ? "Relinquishing..." : "Yeah it sucks these days anyway"}
      </button>
      <button onClick={() => setConfirming(false)}>Never mind</button>
    </div>
  );
}
