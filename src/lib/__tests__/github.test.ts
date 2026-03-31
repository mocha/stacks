import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRepoInfo, fetchUserProfile } from "../github";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchRepoInfo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extracts owner/repo from GitHub URL and returns repo data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: "react",
        description: "The library for web and native user interfaces.",
        owner: { avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4" },
        stargazers_count: 225000,
        language: "JavaScript",
      }),
    });

    const result = await fetchRepoInfo("https://github.com/facebook/react");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/facebook/react",
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result).toEqual({
      name: "react",
      description: "The library for web and native user interfaces.",
      logoUrl: "https://avatars.githubusercontent.com/u/69631?v=4",
      stars: 225000,
      language: "JavaScript",
    });
  });

  it("returns null for non-GitHub URLs", async () => {
    const result = await fetchRepoInfo("https://example.com/not-github");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("fetchUserProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches user profile data from GitHub API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        login: "mocha",
        name: "Mocha",
        bio: "I make things",
        location: "Internet",
        company: "Stacklist",
        avatar_url: "https://avatars.githubusercontent.com/u/123",
        public_repos: 42,
        followers: 100,
        following: 50,
        html_url: "https://github.com/mocha",
      }),
    });

    const result = await fetchUserProfile("mocha");

    expect(result).toMatchObject({
      login: "mocha",
      bio: "I make things",
      publicRepos: 42,
    });
  });
});
