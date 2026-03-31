"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";

export function SyncButton({ username }: { username: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await fetch(`/api/users/${username}/sync`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
    setLoading(false);
  };

  return (
    <Button outline onClick={handleSync} disabled={loading}>
      {loading ? "Syncing..." : "Sync GitHub Data"}
    </Button>
  );
}
