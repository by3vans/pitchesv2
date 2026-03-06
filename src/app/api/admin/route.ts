import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all data in parallel
  const [
    { data: profiles },
    { data: subscriptions },
    { data: pitches },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('user_id, plan, status, current_period_start, current_period_end, created_at'),
    supabase.from('pitches').select('id, user_id, created_at, status'),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const planCounts = { free: 0, pro: 0, business: 0 };
  const activeSubsByUser: Record<string, string> = {};
  (subscriptions ?? []).forEach(s => {
    if (s.status === 'active' || s.status === 'trialing') {
      activeSubsByUser[s.user_id] = s.plan;
      if (s.plan === 'pro') planCounts.pro++;
      else if (s.plan === 'business') planCounts.business++;
    }
  });
  planCounts.free = (profiles?.length ?? 0) - planCounts.pro - planCounts.business;

  const PLAN_PRICES: Record<string, number> = { pro: 29, business: 79 };
  const mrr = (subscriptions ?? [])
    .filter(s => s.status === 'active' || s.status === 'trialing')
    .reduce((acc, s) => acc + (PLAN_PRICES[s.plan] ?? 0), 0);

  const newThisWeek = (profiles ?? []).filter(p => new Date(p.created_at) >= startOfWeek).length;
  const newThisMonth = (profiles ?? []).filter(p => new Date(p.created_at) >= startOfMonth).length;
  const newLastMonth = (profiles ?? []).filter(p => {
    const d = new Date(p.created_at);
    return d >= startOfLastMonth && d < startOfMonth;
  }).length;

  const churnedThisMonth = (subscriptions ?? []).filter(s => {
    return s.status === 'canceled' && new Date(s.current_period_end ?? '') >= startOfMonth;
  }).length;

  const usersWithPitch = new Set((pitches ?? []).map(p => p.user_id)).size;
  const adoptionRate = (profiles?.length ?? 0) > 0
    ? Math.round((usersWithPitch / (profiles?.length ?? 1)) * 100)
    : 0;

  const last30Days: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    last30Days[d.toISOString().split('T')[0]] = 0;
  }
  (profiles ?? []).forEach(p => {
    const day = p.created_at?.split('T')[0];
    if (day && last30Days[day] !== undefined) last30Days[day]++;
  });
  const growthChart = Object.entries(last30Days).map(([date, count]) => ({ date, count }));

  const recentUsers = (profiles ?? []).slice(0, 20).map(p => ({
    ...p,
    plan: activeSubsByUser[p.id] ?? 'free',
  }));

  const pitchCountByUser: Record<string, number> = {};
  (pitches ?? []).forEach(p => {
    pitchCountByUser[p.user_id] = (pitchCountByUser[p.user_id] ?? 0) + 1;
  });
  const topUsers = Object.entries(pitchCountByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => {
      const profile = (profiles ?? []).find(p => p.id === userId);
      return { userId, count, name: profile?.full_name ?? 'Unknown', email: profile?.email ?? '' };
    });

  return NextResponse.json({
    overview: {
      totalUsers: profiles?.length ?? 0,
      mrr,
      newThisWeek,
      newThisMonth,
      newLastMonth,
      churnedThisMonth,
      adoptionRate,
      planCounts,
      totalPitches: pitches?.length ?? 0,
    },
    growthChart,
    recentUsers,
    topUsers,
  });
}