"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AuthButton({
  user,
}: {
  user: { providerUsername: string; avatarUrl?: string | null } | null;
}) {
  const router = useRouter();

  const handleLogin = () => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = () => {
    const supabase = createClient();
    supabase.auth.signOut().then(() => router.refresh());
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
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="rounded-lg border border-zinc-950/10 dark:border-white/15 px-3 py-1.5 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
    >
      Sign in with GitHub
    </button>
  );
}
