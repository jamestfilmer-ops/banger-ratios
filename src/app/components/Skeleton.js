'use client'
 
// Reusable shimmer skeleton — drop anywhere to replace loading states.
// Usage:  <Skeleton width={200} height={20} />
// Usage:  <Skeleton width='100%' height={14} radius={4} />
 
export default function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}
 
// Album card skeleton — matches the shape of a real album card
export function AlbumCardSkeleton() {
  return (
    <div style={{
      background: 'white', border: '1px solid #E5E5E5',
      borderRadius: 14, padding: 16,
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <Skeleton width={64} height={64} radius={10} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width='70%' height={14} />
        <Skeleton width='45%' height={12} />
        <Skeleton width='30%' height={12} />
      </div>
    </div>
  )
}
 
// Leaderboard row skeleton
export function LeaderboardRowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', border: '1px solid #E5E5E5',
      borderRadius: 12, background: 'white',
    }}>
      <Skeleton width={28} height={28} radius={6} />
      <Skeleton width={48} height={48} radius={8} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width='60%' height={14} />
        <Skeleton width='40%' height={12} />
      </div>
      <Skeleton width={52} height={28} radius={8} />
    </div>
  )
}
