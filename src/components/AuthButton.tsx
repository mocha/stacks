"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AuthButton({
  user,
}: {
  user: { providerUsername: string } | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (provider: "github" | "gitlab") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div>
        <a href={`/u/${user.providerUsername}`}>@{user.providerUsername}</a>
        <button onClick={handleLogout}>Log out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => handleLogin("github")}>
        Sign in with GitHub
      </button>
      <button onClick={() => handleLogin("gitlab")}>
        Sign in with GitLab
      </button>
    </div>
  );
}
