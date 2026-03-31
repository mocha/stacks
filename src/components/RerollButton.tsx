"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";

export function RerollButton({
  acronym,
  rerollsRemaining,
}: {
  acronym: string;
  rerollsRemaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReroll = async () => {
    setLoading(true);
    const res = await fetch(`/api/stacks/${acronym}/reroll`, {
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
    <Button
      outline
      onClick={handleReroll}
      disabled={loading || rerollsRemaining <= 0}
    >
      {loading
        ? "Rerolling..."
        : `Reroll Description (${rerollsRemaining} left today)`}
    </Button>
  );
}
