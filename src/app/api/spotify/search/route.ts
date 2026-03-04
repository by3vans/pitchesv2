import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? '';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment variables.');
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify auth failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=8`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`Spotify search failed: ${err}`);
    }

    const data = await searchRes.json();

    const artists = (data.artists?.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      genres: a.genres ?? [],
      popularity: a.popularity ?? 0,
      followers: a.followers?.total ?? 0,
      images: (a.images ?? []).map((img: any) => ({
        url: img.url,
        width: img.width,
        height: img.height,
      })),
      spotifyUrl: a.external_urls?.spotify ?? '',
    }));

    return NextResponse.json({ artists });
  } catch (err: any) {
    const message = err?.message ?? 'Unknown error';
    const isCredentials = message.includes('not configured');
    return NextResponse.json(
      { error: message },
      { status: isCredentials ? 503 : 500 }
    );
  }
}
