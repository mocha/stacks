"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/components/catalyst/dialog";

export function RelinquishButton({ acronym }: { acronym: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)}>
        Relinquish
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Relinquish your stack?</DialogTitle>
        <DialogDescription>
          This will permanently release the {acronym} stack. Someone else can claim it after.
        </DialogDescription>
        <DialogBody>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Are you sure you want to give this up?
          </p>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Never mind
          </Button>
          <Button color="red" onClick={handleRelinquish} disabled={loading}>
            {loading ? "Relinquishing..." : "Yeah it sucks these days anyway"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
