import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fetchUserProfile } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!dbUser || dbUser.providerUsername !== username) {
    return NextResponse.json(
      { error: "You can only sync your own profile" },
      { status: 403 }
    );
  }

  const profileData = await fetchUserProfile(username);
  if (!profileData) {
    return NextResponse.json(
      { error: "Could not fetch GitHub profile" },
      { status: 502 }
    );
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      displayName: profileData.name,
      avatarUrl: profileData.avatarUrl,
      githubData: profileData as object,
      githubDataSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ profile: profileData });
}
