// ─── Skeleton.js ──────────────────────────────────────────────────────────
// Drop-in skeleton loaders. Use wherever you currently show "Loading..."
// 
// HOW TO USE:
//   import { AlbumCardSkeleton, AlbumPageSkeleton, LeaderboardSkeleton,
//            ProfileSkeleton, TrackRowSkeleton } from '../components/Skeleton'
//
// Replace your loading states:
//   {loading ? <AlbumCardSkeleton count={6} /> : <YourContent />}

'use client'

// Pulse keyframe — add once to globals.css if not already there:
// @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

const shimmer = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s ease infinite',
}

function Box({ w = '100%', h = 16, r = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      ...shimmer, flexShrink: 0, ...style,
    }} />
  )
}

// ── Single album card skeleton ─────────────────────────────────────────────
function AlbumCardSkeleton() {
  return (
    <div style={{
      borderRadius: 12, border: '1px solid #eee',
      overflow: 'hidden', background: 'white',
    }}>
      <Box h={0} style={{ paddingBottom: '100%', borderRadius: 0 }} />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Box h={12} w="80%" />
        <Box h={10} w="55%" />
      </div>
    </div>
  )
}

// ── Grid of album card skeletons ───────────────────────────────────────────
export function AlbumGridSkeleton({ count = 8 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 14,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <AlbumCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Leaderboard row skeleton ───────────────────────────────────────────────
function LeaderboardRowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px', borderRadius: 10,
    }}>
      <Box w={28} h={28} r={4} />
      <Box w={44} h={44} r={8} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Box w="55%" h={13} />
        <Box w="35%" h={10} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <Box w={48} h={22} r={4} />
        <Box w={60} h={9} />
      </div>
    </div>
  )
}

export function LeaderboardSkeleton({ count = 10 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Track row skeleton (for album page) ───────────────────────────────────
export function TrackListSkeleton({ count = 10 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 10, border: '1px solid #eee',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Box w={24} h={24} r={4} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Box w={`${50 + Math.random() * 30}%`} h={13} />
            <Box w="20%" h={10} />
          </div>
          {/* Rating buttons placeholder */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 7 }).map((_, j) => (
              <Box key={j} w={32} h={32} r={6} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Album page header skeleton ─────────────────────────────────────────────
export function AlbumHeaderSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'flex-start' }}>
      <Box w={160} h={160} r={12} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
        <Box w="70%" h={28} />
        <Box w="40%" h={18} />
        <Box w="25%" h={14} />
        <div style={{ marginTop: 8 }}>
          <Box w={120} h={48} r={10} />
        </div>
      </div>
    </div>
  )
}

// ── Profile page skeleton ──────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
      {/* Banner */}
      <Box h={140} r={14} style={{ marginBottom: 0 }} />
      {/* Avatar + name */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginTop: -40, marginBottom: 24 }}>
        <Box w={80} h={80} r={40} style={{ border: '3px solid white', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 4 }}>
          <Box w={180} h={22} />
          <Box w={100} h={14} />
        </div>
      </div>
      <LeaderboardSkeleton count={5} />
    </div>
  )
}

// ─── ADD TO globals.css ────────────────────────────────────────────────────
// @keyframes shimmer {
//   0%   { background-position: -400px 0; }
//   100% { background-position:  400px 0; }
// }