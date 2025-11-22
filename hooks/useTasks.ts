import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuthStore } from "../stores/authStore";
import { useEffect } from "react";

/**
 * Types
 */
export type Todo = {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
  isDeleted?: boolean;
  deletedOn?: string;
  _clientId?: string; // unique client-side identifier (for temporary items)
  _isClientOnly?: boolean; // marker for todos only created client-side
};

type TodosResponse = {
  todos: Todo[];
  total?: number;
  skip?: number;
  limit?: number;
};

type DeleteTaskContext = {
  previous?: TodosResponse;
  isClientOnly?: boolean;
};

type UpdateTaskContext = {
  previous?: TodosResponse;
};

/**
 * Generate a unique client-side ID for optimistic / client-only todos
 */
function generateClientId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ensure unique ID for a todo by checking existing todos.
 * If there's an ID collision, assign a new numeric id (max+1) and set a _clientId.
 */
function ensureUniqueId(todo: Todo, existingTodos: Todo[]): Todo {
  const existingIds = new Set(existingTodos.map((t) => t.id));
  if (existingIds.has(todo.id)) {
    const maxId = Math.max(0, ...existingTodos.map((t) => t.id));
    const newId = maxId + 1;
    console.warn(`Duplicate todo ID detected: ${todo.id}. Assigning new ID: ${newId}`, { original: todo });
    return { ...todo, id: newId, _clientId: generateClientId() };
  }
  return todo;
}

/**
 * useTasks - fetch todos for the current user
 */
export function useTasks(): UseQueryResult<TodosResponse, unknown> {
  const user = useAuthStore((s) => s.user);

  const query = useQuery<TodosResponse>({
    queryKey: ["todos", user?.id ?? null],
    queryFn: async () => {
      if (!user?.id) return { todos: [], total: 0 };
      const res = await api.get(`/todos/user/${user.id}`);
      const data = res.data as TodosResponse;

      // detect duplicate ids from server response and reassign
      const idCounts = new Map<number, number>();
      data.todos.forEach((todo) => idCounts.set(todo.id, (idCounts.get(todo.id) || 0) + 1));

      const hasDuplicates = Array.from(idCounts.values()).some((count) => count > 1);
      if (hasDuplicates) {
        console.warn("Duplicate IDs detected in server response, reassigning...");
        const seenIds = new Set<number>();
        let maxId = Math.max(0, ...data.todos.map((t) => t.id));
        data.todos = data.todos.map((todo) => {
          if (seenIds.has(todo.id)) {
            maxId++;
            return { ...todo, id: maxId, _clientId: generateClientId() };
          }
          seenIds.add(todo.id);
          return todo;
        });
      }

      return data;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      window.dispatchEvent(new CustomEvent("resetIdle"));
    }
  }, [query.isSuccess]);

  return query;
}

/**
 * Cache helpers
 */
function updateTodosCacheAppend(qc: ReturnType<typeof useQueryClient>, userId: number, newTodo: Todo) {
  const key = ["todos", userId];
  const prev = qc.getQueryData<TodosResponse>(key);

  if (!prev) {
    qc.setQueryData<TodosResponse>(key, { todos: [newTodo], total: 1, skip: 0, limit: 30 });
    return;
  }

  const uniqueTodo = ensureUniqueId(newTodo, prev.todos);

  const exists = prev.todos.some(
    (t) =>
      t.id === uniqueTodo.id ||
      (t._clientId && uniqueTodo._clientId && t._clientId === uniqueTodo._clientId)
  );

  if (!exists) {
    qc.setQueryData<TodosResponse>(key, {
      ...prev,
      todos: [uniqueTodo, ...prev.todos],
      total: typeof prev.total === "number" ? prev.total + 1 : prev.todos.length + 1,
    });
  }
}

function replaceTodoInCache(qc: ReturnType<typeof useQueryClient>, userId: number, updated: Todo) {
  const key = ["todos", userId];
  const prev = qc.getQueryData<TodosResponse>(key);
  if (!prev) return;
  qc.setQueryData<TodosResponse>(key, {
    ...prev,
    todos: prev.todos.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
  });
}

function removeTodoFromCache(qc: ReturnType<typeof useQueryClient>, userId: number, idToRemove: number) {
  const key = ["todos", userId];
  const prev = qc.getQueryData<TodosResponse>(key);
  if (!prev) return;
  const newTodos = prev.todos.filter((t) => t.id !== idToRemove);
  qc.setQueryData<TodosResponse>(key, {
    ...prev,
    todos: newTodos,
    total: typeof prev.total === "number" ? Math.max(0, prev.total - 1) : newTodos.length,
  });
}

/**
 * useCreateTask
 */
export function useCreateTask(): UseMutationResult<Todo, unknown, { todo: string; completed?: boolean }, unknown> {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation<Todo, unknown, { todo: string; completed?: boolean }>({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post("/todos/add", { ...payload, userId: user.id });
      const createdTodo = res.data as Todo;
      // mark client-only and give clientId
      return { ...createdTodo, _clientId: generateClientId(), _isClientOnly: true };
    },
    onSuccess: (createdTodo) => {
      if (user?.id) updateTodosCacheAppend(qc, user.id, createdTodo);
      window.dispatchEvent(new CustomEvent("resetIdle"));
    },
    onError: (err) => {
      console.error("createTask error:", err);
    },
  });
}

/**
 * useUpdateTask - updates a todo (PATCH for partial update)
 *
 * - Ensures the request body does not include `id`.
 * - Includes the current cached values for fields not present in `updates`
 *   so the DummyJSON simulated response contains the latest local state.
 * - Keeps optimistic update and rollback behavior.
 */
export function useUpdateTask(): UseMutationResult<
  Todo,
  unknown,
  { id: number; updates: Partial<Pick<Todo, "todo" | "completed">> },
  UpdateTaskContext
> {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation<Todo, unknown, { id: number; updates: Partial<Pick<Todo, "todo" | "completed">> }, UpdateTaskContext>({
    mutationFn: async ({ id, updates }) => {
      const key = ["todos", user?.id ?? null];
      const cachedData = qc.getQueryData<TodosResponse>(key);
      const todo = cachedData?.todos.find((t) => t.id === id);

      // Client-only todo (created locally): update locally and return
      if (todo?._isClientOnly) {
        const updatedLocal = { ...todo, ...updates };
        if (user?.id) replaceTodoInCache(qc, user.id, updatedLocal as Todo);
        return updatedLocal as Todo;
      }

      // Build bodyToSend WITHOUT id. Include only fields API expects.
      // But ensure we include the current cached values for fields not provided in updates
      // so DummyJSON's simulated response has the merged state.
      const bodyToSend: Record<string, unknown> = {};

      // If updates include 'todo', send it; otherwise, if we have cached todo, include its text
      if (updates.todo !== undefined) {
        bodyToSend.todo = updates.todo;
      } else if (todo?.todo !== undefined) {
        bodyToSend.todo = todo.todo;
      }

      // If updates include 'completed', send it; otherwise, if we have cached todo, include its completed
      if (updates.completed !== undefined) {
        bodyToSend.completed = updates.completed;
      } else if (typeof todo?.completed === "boolean") {
        bodyToSend.completed = todo.completed;
      }

      try {
        const res = await api.patch(`/todos/${id}`, bodyToSend);
        const updated = res.data as Todo;
        if (user?.id) replaceTodoInCache(qc, user.id, updated);
        return updated;
      } catch (err: any) {
        // If server says not found but we have a cached todo, apply local update
        if (err?.response?.status === 404 && todo) {
          const updatedLocal = { ...todo, ...updates };
          if (user?.id) replaceTodoInCache(qc, user.id, updatedLocal as Todo);
          return updatedLocal as Todo;
        }
        throw err;
      }
    },

    onMutate: async ({ id, updates }): Promise<UpdateTaskContext> => {
      if (!user?.id) return { previous: undefined };
      const key = ["todos", user.id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TodosResponse>(key);

      if (previous) {
        qc.setQueryData<TodosResponse>(key, {
          ...previous,
          todos: previous.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        });
      }

      return { previous };
    },

    onError: (err, variables, context) => {
      const userId = useAuthStore.getState().user?.id;
      if (context?.previous && userId) {
        qc.setQueryData<TodosResponse>(["todos", userId], context.previous);
      }
      console.error("updateTask error:", err);
    },

    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("resetIdle"));
    },
  });
}



/**
 * useDeleteTask - deletes a todo by id
 */
export function useDeleteTask(): UseMutationResult<void, unknown, number, DeleteTaskContext> {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation<void, unknown, number, DeleteTaskContext>({
    mutationFn: async (id) => {
      const key = ["todos", user?.id ?? null];
      const cachedData = qc.getQueryData<TodosResponse>(key);
      const todo = cachedData?.todos.find((t) => t.id === id);

      if (todo?._isClientOnly) {
        // skip API call for client-only todo
        return;
      }

      try {
        await api.delete(`/todos/${id}`);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // treat as already gone
          return;
        }
        throw err;
      }
    },
    onMutate: async (id): Promise<DeleteTaskContext> => {
      if (!user?.id) return {};
      const key = ["todos", user.id];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TodosResponse>(key);
      const todo = previous?.todos.find((t) => t.id === id);
      const isClientOnly = todo?._isClientOnly ?? false;

      if (previous) {
        qc.setQueryData<TodosResponse>(key, {
          ...previous,
          todos: previous.todos.filter((t) => t.id !== id),
          total: typeof previous.total === "number" ? Math.max(0, previous.total - 1) : previous.todos.length - 1,
        });
      }

      return { previous, isClientOnly };
    },
    onError: (err, id, context) => {
      const userId = useAuthStore.getState().user?.id;
      if (context?.previous && userId && !context.isClientOnly) {
        qc.setQueryData<TodosResponse>(["todos", userId], context.previous);
      }
      console.error("deleteTask error, rolling back:", err);
    },
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("resetIdle"));
    },
  });
}
