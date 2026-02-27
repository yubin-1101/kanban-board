import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { avatarGradient } from '../../lib/utils';
import { getCard, updateCard, deleteCard } from '../../services/cardApi';
import { getComments, createComment, deleteComment } from '../../services/commentApi';
import { getBoardLabels, createLabel, addCardLabel, removeCardLabel } from '../../services/labelApi';
import {
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../../services/checklistApi';
import { addAssignee, removeAssignee } from '../../services/assigneeApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import type { Comment, Label, BoardMember } from '@kanban/shared';

const LABEL_COLORS = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563'];

interface CardDetailModalProps {
  boardId: string;
  boardMembers?: BoardMember[];
  boardLabels?: Label[];
}

export default function CardDetailModal({ boardId, boardMembers = [], boardLabels = [] }: CardDetailModalProps) {
  const { selectedCardId, isCardModalOpen, closeCardModal } = useUiStore();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  const { data: card } = useQuery({
    queryKey: ['card', selectedCardId],
    queryFn: () => getCard(selectedCardId!),
    enabled: !!selectedCardId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', selectedCardId],
    queryFn: () => getComments(selectedCardId!),
    enabled: !!selectedCardId,
  });

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setDueDate(card.due_date ? card.due_date.split('T')[0] : '');
    }
  }, [card]);

  const invalidateCard = () => {
    queryClient.invalidateQueries({ queryKey: ['card', selectedCardId] });
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const updateMutation = useMutation({
    mutationFn: (input: Record<string, any>) => updateCard(selectedCardId!, input),
    onSuccess: invalidateCard,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCard(selectedCardId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      closeCardModal();
      toast.success('카드가 삭제되었습니다');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: () => createComment(selectedCardId!, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', selectedCardId] });
      setCommentText('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', selectedCardId] }),
  });

  const addLabelMutation = useMutation({
    mutationFn: (labelId: string) => addCardLabel(selectedCardId!, labelId),
    onSuccess: invalidateCard,
  });

  const removeLabelMutation = useMutation({
    mutationFn: (labelId: string) => removeCardLabel(selectedCardId!, labelId),
    onSuccess: invalidateCard,
  });

  const createLabelMutation = useMutation({
    mutationFn: () => createLabel(boardId, newLabelName, newLabelColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setNewLabelName('');
    },
  });

  const addAssigneeMutation = useMutation({
    mutationFn: (userId: string) => addAssignee(selectedCardId!, userId),
    onSuccess: invalidateCard,
  });

  const removeAssigneeMutation = useMutation({
    mutationFn: (userId: string) => removeAssignee(selectedCardId!, userId),
    onSuccess: invalidateCard,
  });

  const createChecklistMutation = useMutation({
    mutationFn: () => createChecklist(selectedCardId!, newChecklistTitle),
    onSuccess: () => {
      invalidateCard();
      setNewChecklistTitle('');
      setShowAddChecklist(false);
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: deleteChecklist,
    onSuccess: invalidateCard,
  });

  const addChecklistItemMutation = useMutation({
    mutationFn: ({ checklistId, title }: { checklistId: string; title: string }) =>
      createChecklistItem(checklistId, title),
    onSuccess: invalidateCard,
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: ({ itemId, is_completed }: { itemId: string; is_completed: boolean }) =>
      updateChecklistItem(itemId, { is_completed }),
    onSuccess: invalidateCard,
  });

  const deleteChecklistItemMutation = useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: invalidateCard,
  });

  if (!isCardModalOpen || !selectedCardId) return null;

  const cardLabelIds = card?.labels?.map((cl) => cl.label_id) ?? [];
  const cardAssigneeIds = card?.assignees?.map((a) => a.user_id) ?? [];

  const handleSaveTitle = () => {
    if (title.trim() && title !== card?.title) {
      updateMutation.mutate({ title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    updateMutation.mutate({ description: description || null });
    setEditingDesc(false);
  };

  const handleSaveDueDate = () => {
    updateMutation.mutate({ due_date: dueDate || null });
    setShowDatePicker(false);
  };

  const profileGrad = avatarGradient(profile?.display_name);

  return (
    <Modal isOpen={isCardModalOpen} onClose={closeCardModal} size="xl">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Title */}
          {editingTitle ? (
            <input
              className="w-full text-xl font-semibold px-3 py-2 border border-surface-border rounded-xl text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              autoFocus
            />
          ) : (
            <h2
              className="text-xl font-semibold text-ink-primary cursor-text hover:bg-surface-raised px-3 py-2 rounded-xl transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {card?.title || '로딩 중...'}
            </h2>
          )}

          {/* Labels display */}
          {cardLabelIds.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-tertiary uppercase mb-2">라벨</h4>
              <div className="flex flex-wrap gap-1.5">
                {card?.labels?.map((cl) => (
                  <span
                    key={cl.id}
                    className="px-3 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: cl.label?.color }}
                  >
                    {cl.label?.name || ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignees display */}
          {cardAssigneeIds.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-tertiary uppercase mb-2">담당자</h4>
              <div className="flex gap-2">
                {card?.assignees?.map((a) => {
                  const grad = avatarGradient(a.profile?.display_name);
                  return (
                    <div key={a.id} className="flex items-center gap-1.5 bg-surface-raised rounded-full px-2 py-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
                      >
                        {a.profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs text-ink-secondary">{a.profile?.display_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Due date display */}
          {card?.due_date && (
            <div>
              <h4 className="text-xs font-semibold text-ink-tertiary uppercase mb-1">마감일</h4>
              <p className={`text-sm ${new Date(card.due_date) < new Date() ? 'text-red-500' : 'text-ink-secondary'}`}>
                {new Date(card.due_date).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-ink-tertiary uppercase mb-2">설명</h4>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-3 border border-surface-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 text-sm text-ink-primary placeholder:text-ink-tertiary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="카드에 대한 상세 설명을 입력하세요..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription}>저장</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>취소</Button>
                </div>
              </div>
            ) : (
              <div
                className="min-h-[60px] p-3 bg-surface-raised rounded-xl cursor-pointer hover:bg-zinc-100 text-sm text-ink-secondary whitespace-pre-wrap transition-colors"
                onClick={() => setEditingDesc(true)}
              >
                {description || '설명을 추가하세요...'}
              </div>
            )}
          </div>

          {/* Checklists */}
          {card?.checklists && card.checklists.length > 0 && (
            <div className="space-y-4">
              {card.checklists.map((checklist) => {
                const total = checklist.items?.length || 0;
                const done = checklist.items?.filter((i) => i.is_completed).length || 0;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={checklist.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-ink-primary">{checklist.title}</h4>
                      <button
                        className="text-xs text-ink-tertiary hover:text-red-500 transition-colors"
                        onClick={() => deleteChecklistMutation.mutate(checklist.id)}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                        <span>{percent}%</span>
                        <div className="flex-1 bg-surface-raised rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : 'bg-accent-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {checklist.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={() =>
                              toggleChecklistItemMutation.mutate({
                                itemId: item.id,
                                is_completed: !item.is_completed,
                              })
                            }
                            className="checkbox-modern"
                          />
                          <span
                            className={`flex-1 text-sm ${item.is_completed ? 'line-through text-ink-tertiary' : 'text-ink-secondary'}`}
                          >
                            {item.title}
                          </span>
                          <button
                            className="text-xs text-ink-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => deleteChecklistItemMutation.mutate(item.id)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add item */}
                    <div className="mt-2">
                      <input
                        className="w-full px-3 py-1.5 text-sm border border-surface-border rounded-xl text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                        placeholder="항목 추가..."
                        value={newItemTexts[checklist.id] || ''}
                        onChange={(e) =>
                          setNewItemTexts((prev) => ({ ...prev, [checklist.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newItemTexts[checklist.id]?.trim()) {
                            addChecklistItemMutation.mutate({
                              checklistId: checklist.id,
                              title: newItemTexts[checklist.id].trim(),
                            });
                            setNewItemTexts((prev) => ({ ...prev, [checklist.id]: '' }));
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comments */}
          <div>
            <h4 className="text-xs font-semibold text-ink-tertiary uppercase mb-3">댓글</h4>
            <div className="flex gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${profileGrad.from}, ${profileGrad.to})` }}
              >
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full p-3 border border-surface-border rounded-xl resize-none text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                  placeholder="댓글을 입력하세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                />
                {commentText.trim() && (
                  <Button
                    size="sm"
                    className="mt-1"
                    onClick={() => addCommentMutation.mutate()}
                    isLoading={addCommentMutation.isPending}
                  >
                    저장
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {comments.map((comment: Comment) => {
                const commentGrad = avatarGradient(comment.profile?.display_name);
                return (
                  <div key={comment.id} className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${commentGrad.from}, ${commentGrad.to})` }}
                    >
                      {comment.profile?.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-primary">
                          {comment.profile?.display_name}
                        </span>
                        <span className="text-xs text-ink-tertiary">
                          {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                        </span>
                        {comment.user_id === profile?.id && (
                          <button
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-ink-secondary mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete card */}
          <div className="flex justify-end border-t border-surface-border pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('이 카드를 삭제하시겠습니까?')) deleteMutation.mutate();
              }}
            >
              카드 삭제
            </Button>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="w-44 flex-shrink-0 space-y-2">
          <p className="text-xs font-semibold text-ink-tertiary uppercase mb-2">추가</p>

          {/* Labels */}
          <div className="relative">
            <button
              className="w-full text-left text-sm bg-surface-raised hover:bg-zinc-200 rounded-xl px-3 py-2 transition-colors text-ink-secondary"
              onClick={() => setShowLabelPicker(!showLabelPicker)}
            >
              라벨
            </button>
            {showLabelPicker && (
              <div className="absolute right-0 top-10 bg-surface-card rounded-xl shadow-raised border border-surface-border p-3 z-20 w-56 dropdown-panel">
                <p className="text-xs font-semibold text-ink-tertiary mb-2">라벨 선택</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {boardLabels.map((label) => {
                    const isActive = cardLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-surface-raised transition-colors ${isActive ? 'ring-2 ring-accent-400' : ''}`}
                        onClick={() =>
                          isActive
                            ? removeLabelMutation.mutate(label.id)
                            : addLabelMutation.mutate(label.id)
                        }
                      >
                        <span className="w-8 h-5 rounded-md" style={{ backgroundColor: label.color }} />
                        <span className="text-ink-secondary">{label.name || '이름 없음'}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-surface-border mt-2 pt-2">
                  <p className="text-xs text-ink-tertiary mb-1">새 라벨</p>
                  <div className="flex gap-1 mb-1 flex-wrap">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-6 h-4 rounded-md transition-all ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-accent-400' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewLabelColor(c)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      className="flex-1 px-2 py-1 text-xs border border-surface-border rounded-lg text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent-500"
                      placeholder="라벨 이름"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => createLabelMutation.mutate()}
                      disabled={!newLabelColor}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="relative">
            <button
              className="w-full text-left text-sm bg-surface-raised hover:bg-zinc-200 rounded-xl px-3 py-2 transition-colors text-ink-secondary"
              onClick={() => setShowAssigneePicker(!showAssigneePicker)}
            >
              담당자
            </button>
            {showAssigneePicker && (
              <div className="absolute right-0 top-10 bg-surface-card rounded-xl shadow-raised border border-surface-border p-3 z-20 w-56 dropdown-panel">
                <p className="text-xs font-semibold text-ink-tertiary mb-2">담당자 선택</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {boardMembers.map((member) => {
                    const isAssigned = cardAssigneeIds.includes(member.user_id);
                    const memberGrad = avatarGradient(member.profile?.display_name);
                    return (
                      <button
                        key={member.id}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-surface-raised transition-colors ${isAssigned ? 'bg-accent-50' : ''}`}
                        onClick={() =>
                          isAssigned
                            ? removeAssigneeMutation.mutate(member.user_id)
                            : addAssigneeMutation.mutate(member.user_id)
                        }
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ background: `linear-gradient(135deg, ${memberGrad.from}, ${memberGrad.to})` }}
                        >
                          {member.profile?.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-ink-secondary">{member.profile?.display_name}</span>
                        {isAssigned && <span className="ml-auto text-accent-500 text-xs">&#10003;</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="relative">
            <button
              className="w-full text-left text-sm bg-surface-raised hover:bg-zinc-200 rounded-xl px-3 py-2 transition-colors text-ink-secondary"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              마감일
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-10 bg-surface-card rounded-xl shadow-raised border border-surface-border p-3 z-20 w-56 dropdown-panel">
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-surface-border rounded-xl mb-2 text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveDueDate}>저장</Button>
                  {card?.due_date && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDueDate('');
                        updateMutation.mutate({ due_date: null });
                        setShowDatePicker(false);
                      }}
                    >
                      제거
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="relative">
            <button
              className="w-full text-left text-sm bg-surface-raised hover:bg-zinc-200 rounded-xl px-3 py-2 transition-colors text-ink-secondary"
              onClick={() => setShowAddChecklist(!showAddChecklist)}
            >
              체크리스트
            </button>
            {showAddChecklist && (
              <div className="absolute right-0 top-10 bg-surface-card rounded-xl shadow-raised border border-surface-border p-3 z-20 w-56 dropdown-panel">
                <input
                  className="w-full px-3 py-1.5 text-sm border border-surface-border rounded-xl mb-2 text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
                  placeholder="체크리스트 제목"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newChecklistTitle.trim()) {
                      createChecklistMutation.mutate();
                    }
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => createChecklistMutation.mutate()}
                  disabled={!newChecklistTitle.trim()}
                >
                  추가
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
