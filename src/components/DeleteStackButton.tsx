"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";

export function DeleteStackButton({ acronym }: { acronym: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this stack?")) return;

    const res = await fetch(`/api/stacks/${acronym}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmation: "Yeah it sucks these days anyway",
      }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <Button
      plain
      onClick={handleDelete}
      className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
      title="Delete stack"
    >
      <span aria-hidden="true">&times;</span>
    </Button>
  );
}
