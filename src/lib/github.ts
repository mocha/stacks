const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function fetchRepoInfo(githubUrl: string) {
  const parsed = parseGitHubRepoUrl(githubUrl);
  if (!parsed) return null;

  const res = await fetch(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`, {
    headers: githubHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    name: data.name as string,
    description: (data.description ?? "") as string,
    logoUrl: (data.owner?.avatar_url ?? "") as string,
    stars: data.stargazers_count as number,
    language: (data.language ?? "") as string,
  };
}

export async function fetchUserProfile(username: string) {
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: githubHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    login: data.login as string,
    name: (data.name ?? data.login) as string,
    bio: (data.bio ?? "") as string,
    location: (data.location ?? "") as string,
    company: (data.company ?? "") as string,
    avatarUrl: data.avatar_url as string,
    publicRepos: data.public_repos as number,
    followers: data.followers as number,
    following: data.following as number,
    htmlUrl: data.html_url as string,
  };
}
