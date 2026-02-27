import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoardDetail } from '../services/boardApi';
import { createList, updateList, moveList, deleteList } from '../services/listApi';
import { createCard, updateCard, moveCard, deleteCard } from '../services/cardApi';
import toast from 'react-hot-toast';
import type { BoardDetail, MoveCardInput } from '@kanban/shared';

export function useBoard(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['board', boardId];

  const boardQuery = useQuery({
    queryKey,
    queryFn: () => getBoardDetail(boardId),
    enabled: !!boardId,
  });

  const createListMutation = useMutation({
    mutationFn: (title: string) => createList(boardId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('리스트 생성에 실패했습니다'),
  });

  const updateListMutation = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      updateList(listId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveListMutation = useMutation({
    mutationFn: ({ listId, position }: { listId: string; position: number }) =>
      moveList(listId, position),
    onMutate: async ({ listId, position }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      if (previous) {
        const lists = [...previous.lists];
        const idx = lists.findIndex((l) => l.id === listId);
        if (idx !== -1) {
          lists[idx] = { ...lists[idx], position };
          lists.sort((a, b) => a.position - b.position);
          queryClient.setQueryData(queryKey, { ...previous, lists });
        }
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteListMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('리스트가 삭제되었습니다');
    },
  });

  const createCardMutation = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      createCard(listId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error('카드 생성에 실패했습니다'),
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, ...input }: { cardId: string } & Record<string, any>) =>
      updateCard(cardId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveCardMutation = useMutation({
    mutationFn: (input: MoveCardInput) => moveCard(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      if (previous) {
        const lists = previous.lists.map((l) => ({
          ...l,
          cards: l.cards.filter((c) => c.id !== input.card_id),
        }));
        const targetList = lists.find((l) => l.id === input.target_list_id);
        if (targetList) {
          const card = previous.lists
            .flatMap((l) => l.cards)
            .find((c) => c.id === input.card_id);
          if (card) {
            targetList.cards.push({
              ...card,
              list_id: input.target_list_id,
              position: input.position,
            });
            targetList.cards.sort((a, b) => a.position - b.position);
          }
        }
        queryClient.setQueryData(queryKey, { ...previous, lists });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteCardMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('카드가 삭제되었습니다');
    },
  });

  return {
    board: boardQuery.data,
    isLoading: boardQuery.isLoading,
    error: boardQuery.error,
    createList: createListMutation.mutate,
    updateList: updateListMutation.mutate,
    moveList: moveListMutation.mutate,
    deleteList: deleteListMutation.mutate,
    createCard: createCardMutation.mutate,
    updateCard: updateCardMutation.mutate,
    moveCard: moveCardMutation.mutate,
    deleteCard: deleteCardMutation.mutate,
  };
}
