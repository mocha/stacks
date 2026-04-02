"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";

export function AuthButton({
  user,
}: {
  user: { providerUsername: string; avatarUrl?: string | null } | null;
}) {
  const router = useRouter();

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt="" className="size-6 rounded-full" />
        )}
        <a href={`/u/${user.providerUsername}`} className="text-sm font-medium text-zinc-950 dark:text-white">
          @{user.providerUsername}
        </a>
        <Button plain onClick={handleLogout} className="text-sm">
          Log out
        </Button>
      </div>
    );
  }

  return (
    <Button outline onClick={handleLogin}>
      Sign in with GitHub
    </Button>
  );
}
