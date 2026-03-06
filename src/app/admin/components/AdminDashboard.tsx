'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Overview {
  totalUsers: number; mrr: number; newThisWeek: number; newThisMonth: number;
  newLastMonth: number; churnedThisMonth: number; adoptionRate: number;
  planCounts: { free: number; pro: number; business: number }; totalPitches: number;
}
interface AdminData {
  overview: Overview;
  growthChart: { date: string; count: number }[];
  recentUsers: { id: string; full_name: string; created_at: string; plan: string }[];
  topUsers: { userId: string; count: number; name: string; email: string }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f0eaff', borderRadius: 16, padding: '24px 28px' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9b8ec4', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: '#1a1230', lineHeight: 1, display: 'block' }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: '#9b8ec4', display: 'block', marginTop: 6 }}>{sub}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin')
      .then(r => {
        if (r.status === 403 || r.status === 401) { router.push('/admin-login'); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#7c3aed' }}>Loading...</span>
      </div>
    );
  }

  if (!data) return null;

  const { overview, recentUsers } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#f9f7ff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0eaff', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Pitchhood</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1230' }}>Admin Dashboard</div>
        </div>
        <button style={{ fontSize: 13, color: '#7c3aed', background: '#f0eaff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }} onClick={() => router.push('/dashboard')}>Back to App</button>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard label="MRR" value={'$' + overview.mrr} sub={overview.planCounts.pro + ' Pro · ' + overview.planCounts.business + ' Business'} />
          <StatCard label="Total Users" value={overview.totalUsers} sub={'+' + overview.newThisMonth + ' this month'} />
          <StatCard label="New This Week" value={overview.newThisWeek} />
          <StatCard label="Churn This Month" value={overview.churnedThisMonth} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <StatCard label="Total Pitches" value={overview.totalPitches} sub="across all users" />
          <StatCard label="Feature Adoption" value={overview.adoptionRate + '%'} sub="users with 1+ pitch" />
          <div style={{ background: '#fff', border: '1px solid #f0eaff', borderRadius: 16, padding: '24px 28px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9b8ec4', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>Plan Breakdown</span>
            {(['free', 'pro', 'business'] as const).map(plan => (
              <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan === 'free' ? '#e5e7eb' : plan === 'pro' ? '#7c3aed' : '#4c1d95' }} />
                <span style={{ fontSize: 13, color: '#1a1230', fontWeight: 500, width: 70 }}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                <div style={{ flex: 1, height: 6, background: '#f0eaff', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (overview.totalUsers > 0 ? Math.round((overview.planCounts[plan] / overview.totalUsers) * 100) : 0) + '%', background: '#7c3aed', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>{overview.planCounts[plan]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #f0eaff', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0eaff' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9b8ec4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Signups</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9b8ec4', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9b8ec4', textTransform: 'uppercase' }}>Plan</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9b8ec4', textTransform: 'uppercase' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={u.id} style={{ borderTop: '1px solid #f9f7ff', background: i % 2 === 0 ? '#fff' : '#faf8ff' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#1a1230', fontWeight: 500 }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: u.plan === 'free' ? '#f3f4f6' : '#f0eaff', color: u.plan === 'free' ? '#6b7280' : '#7c3aed', textTransform: 'uppercase' }}>{u.plan}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}