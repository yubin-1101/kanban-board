import type { RemoteCursorData } from '../../hooks/useRealtimePresence';

const PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface RemoteCursorsProps {
  remoteCursors: Map<string, RemoteCursorData>;
}

export default function RemoteCursors({ remoteCursors }: RemoteCursorsProps) {
  if (remoteCursors.size === 0) return null;

  return (
    <>
      {Array.from(remoteCursors.values()).map((cursor) => {
        if (cursor.x === null || cursor.y === null) return null;
        const color = getUserColor(cursor.userId);

        return (
          <div
            key={cursor.userId}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
              transition: 'transform 80ms linear',
            }}
          >
            {/* Cursor arrow SVG */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M0.5 0.5L15 10.5L7.5 11.5L4 19L0.5 0.5Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-4 top-4 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {cursor.displayName}
            </div>
          </div>
        );
      })}
    </>
  );
}
