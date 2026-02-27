'use client'

// Base shimmer skeleton block
// Usage: <Skeleton width={200} height={20} />
// Usage: <Skeleton width="100%" height={14} radius={4} />

export default function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '400px 100%',
      animation: 'shimmer 1.4s ease infinite',
      ...style,
    }} />
  )
}

// Album card loading shape
export function AlbumCardSkeleton() {
  return (
    <div style={{ background:'white', borderRadius:14, border:'1px solid #E5E7EB', overflow:'hidden', padding:12, display:'flex', gap:12 }}>
      <Skeleton width={64} height={64} radius={10} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6, paddingTop:4 }}>
        <Skeleton width='70%' height={14} />
        <Skeleton width='45%' height={12} />
        <Skeleton width='30%' height={12} />
      </div>
    </div>
  )
}

// Leaderboard row loading shape
export function LeaderboardRowSkeleton() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'white', borderRadius:12, border:'1px solid #E5E7EB' }}>
      <Skeleton width={28} height={28} radius={6} />
      <Skeleton width={48} height={48} radius={8} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
        <Skeleton width='60%' height={14} />
        <Skeleton width='40%' height={12} />
      </div>
      <Skeleton width={52} height={28} radius={8} />
    </div>
  )
}

// Profile page loading shape
export function ProfileSkeleton() {
  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'40px 24px' }}>
      {/* Avatar + name header */}
      <div style={{ display:'flex', gap:20, alignItems:'center', marginBottom:32 }}>
        <Skeleton width={80} height={80} radius={40} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
          <Skeleton width='50%' height={20} />
          <Skeleton width='35%' height={14} />
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display:'flex', gap:16, marginBottom:32 }}>
        {[1,2,3].map(i => <Skeleton key={i} width='30%' height={60} radius={12} />)}
      </div>
      {/* Activity rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[1,2,3,4,5].map(i => <LeaderboardRowSkeleton key={i} />)}
      </div>
    </div>
  )
}