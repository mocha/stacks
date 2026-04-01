"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { TextLink } from "@/components/catalyst/text";

export function AuthButton({
  user,
}: {
  user: { providerUsername: string } | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (provider: "github" | "gitlab") => {
    console.log("[AuthButton] handleLogin called with provider:", provider);
    console.log("[AuthButton] redirectTo:", `${window.location.origin}/auth/callback`);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    console.log("[AuthButton] signInWithOAuth result:", { data, error });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <TextLink href={`/u/${user.providerUsername}`}>@{user.providerUsername}</TextLink>
        <Button plain onClick={handleLogout}>
          Log out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button outline onClick={() => handleLogin("github")}>
        Sign in with GitHub
      </Button>
      <Button outline onClick={() => handleLogin("gitlab")}>
        Sign in with GitLab
      </Button>
    </div>
  );
}
