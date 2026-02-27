import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useUiStore } from '../../stores/uiStore';
import { avatarGradient } from '../../lib/utils';
import type { Card } from '@kanban/shared';

interface CardItemProps {
  card: Card;
  isDragOverlay?: boolean;
}

export default function CardItem({ card, isDragOverlay }: CardItemProps) {
  const openCardModal = useUiStore((s) => s.openCardModal);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const labels = card.labels?.map((cl) => cl.label).filter(Boolean) ?? [];
  const hasDescription = !!card.description;
  const hasDueDate = !!card.due_date;
  const hasChecklist = card.checklists && card.checklists.length > 0;
  const checklistTotal = card.checklists?.reduce((sum, cl) => sum + (cl.items?.length || 0), 0) || 0;
  const checklistDone = card.checklists?.reduce((sum, cl) => sum + (cl.items?.filter(i => i.is_completed).length || 0), 0) || 0;
  const isDuePast = hasDueDate && new Date(card.due_date!) < new Date();

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      className={`glass-card rounded-[10px] p-3 cursor-pointer border transition-all duration-200 group/card ${
        isDragOverlay
          ? 'shadow-float rotate-2 scale-105 border-accent-300/50 bg-white'
          : 'shadow-[0_1px_2px_rgba(0,0,0,0.04)] border-black/[0.06] hover:border-black/[0.1] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]'
      }`}
      onClick={() => !isDragging && openCardModal(card.id)}
    >
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map((label) => (
            <span
              key={label!.id}
              className="inline-block h-[5px] min-w-[2rem] rounded-full opacity-90"
              style={{ backgroundColor: label!.color }}
            />
          ))}
        </div>
      )}

      <p className="text-[13px] text-ink-primary break-words leading-relaxed font-medium">{card.title}</p>

      {/* Badges */}
      {(hasDescription || hasDueDate || hasChecklist || (card.assignees && card.assignees.length > 0)) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {hasDescription && (
            <span className="text-ink-tertiary/70 group-hover/card:text-ink-tertiary transition-colors" title="설명 있음">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
          )}
          {hasDueDate && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${
              isDuePast ? 'text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md' : 'text-ink-tertiary/70'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(card.due_date!).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {hasChecklist && checklistTotal > 0 && (
            <span className={`flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
              checklistDone === checklistTotal ? 'text-emerald-600 bg-emerald-50' : 'text-ink-tertiary/70'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {checklistDone}/{checklistTotal}
            </span>
          )}
          {/* Assignee avatars */}
          {card.assignees && card.assignees.length > 0 && (
            <div className="flex -space-x-1.5 ml-auto">
              {card.assignees.slice(0, 3).map((a) => {
                const grad = avatarGradient(a.profile?.display_name);
                return (
                  <div
                    key={a.id}
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[8px] font-bold ring-2 ring-white"
                    style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                    title={a.profile?.display_name}
                  >
                    {a.profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
