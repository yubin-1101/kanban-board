import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoardDetail } from '../services/boardApi';
import { createList, updateList, moveList, deleteList, moveListCanvas } from '../services/listApi';
import { createCard, createFreeCard, updateCard, moveCard, moveCardCanvas, deleteCard } from '../services/cardApi';
import toast from 'react-hot-toast';
import type { BoardDetail, MoveCardInput, MoveCardCanvasInput } from '@kanban/shared';

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

  const moveListCanvasMutation = useMutation({
    mutationFn: ({ listId, x, y }: { listId: string; x: number; y: number }) =>
      moveListCanvas(listId, x, y),
    onMutate: async ({ listId, x, y }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      if (previous) {
        const lists = previous.lists.map((l) =>
          l.id === listId ? { ...l, x_position: x, y_position: y } : l,
        );
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

  const deleteListMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('리스트가 삭제되었습니다');
    },
  });

  const createCardMutation = useMutation({
    mutationFn: ({ listId, title }: { listId: string; title: string }) =>
      createCard(boardId, title, listId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error('카드 생성에 실패했습니다'),
  });

  const createFreeCardMutation = useMutation({
    mutationFn: ({ title, x, y }: { title: string; x: number; y: number }) =>
      createFreeCard(boardId, title, x, y),
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

  const moveCardCanvasMutation = useMutation({
    mutationFn: (input: MoveCardCanvasInput) => moveCardCanvas(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardDetail>(queryKey);
      if (previous) {
        const freeCards = (previous.free_cards ?? []).map((c) =>
          c.id === input.card_id
            ? { ...c, x_position: input.x_position, y_position: input.y_position, list_id: input.list_id }
            : c,
        );
        queryClient.setQueryData(queryKey, { ...previous, free_cards: freeCards });
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
    moveListCanvas: moveListCanvasMutation.mutate,
    deleteList: deleteListMutation.mutate,
    createCard: createCardMutation.mutate,
    createFreeCard: createFreeCardMutation.mutate,
    updateCard: updateCardMutation.mutate,
    moveCard: moveCardMutation.mutate,
    moveCardCanvas: moveCardCanvasMutation.mutate,
    deleteCard: deleteCardMutation.mutate,
  };
}
