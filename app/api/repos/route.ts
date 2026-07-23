import { REPOS } from '@/lib/repos';

export const runtime = 'edge';

export interface RepoStats {
  name: string;
  stars: number | null;
  forks: number | null;
}

/** Live GitHub stats for the showcased repos. Cached at the edge for 1 hour. */
export async function GET() {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'defiagent',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const stats: RepoStats[] = await Promise.all(
    REPOS.map(async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/counterfactual5/${repo.name}`, {
          headers,
          // @ts-ignore — `next` fetch init is valid in Next.js route handlers
          next: { revalidate: 3600 },
        });
        if (!res.ok) return { name: repo.name, stars: null, forks: null };
        const data = await res.json();
        return {
          name: repo.name,
          stars: data.stargazers_count ?? null,
          forks: data.forks_count ?? null,
        };
      } catch {
        return { name: repo.name, stars: null, forks: null };
      }
    })
  );

  return Response.json(
    { repos: stats },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
  );
}
