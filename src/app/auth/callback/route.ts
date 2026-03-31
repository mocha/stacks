import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const meta = data.user.user_metadata;
      const provider = data.user.app_metadata.provider ?? "github";
      const username = meta.user_name ?? meta.preferred_username;

      await prisma.user.upsert({
        where: { supabaseAuthId: data.user.id },
        update: {
          displayName: meta.full_name ?? username,
          avatarUrl: meta.avatar_url,
        },
        create: {
          supabaseAuthId: data.user.id,
          provider,
          providerUsername: username,
          displayName: meta.full_name ?? username,
          avatarUrl: meta.avatar_url,
          profileUrl: provider === "gitlab"
            ? `https://gitlab.com/${username}`
            : `https://github.com/${username}`,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
