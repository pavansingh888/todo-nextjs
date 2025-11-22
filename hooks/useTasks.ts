// /Users/pavan/Desktop/todo-nextjs/hooks/useTasks.ts
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
  _clientId?: string; // Optional client-side generated ID for duplicate detection
  _isClientOnly?: boolean; // Flag to indicate this todo only exists on client
};

type TodosResponse = {
  todos: Todo[];
  total?: number;
  skip?: number;
  limit?: number;
};

// Context type for delete mutation
type DeleteTaskContext = {
  previous?: TodosResponse;
  isClientOnly?: boolean;
};

/**
 * Generate a unique client-side ID for optimistic updates
 * Format: `temp_${timestamp}_${random}`
 */
function generateClientId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ensure unique ID for a todo
 * If the server returns a duplicate ID, we generate a new unique one
 */
function ensureUniqueId(todo: Todo, existingTodos: Todo[]): Todo {
  const existingIds = new Set(existingTodos.map((t) => t.id));
  
  // If ID is not unique, generate a new one
  if (existingIds.has(todo.id)) {
    // Generate a new unique ID by finding the max ID and incrementing
    const maxId = Math.max(0, ...existingTodos.map((t) => t.id));
    const newId = maxId + 1;
    
    console.warn(
      `Duplicate todo ID detected: ${todo.id}. Assigning new ID: ${newId}`,
      { original: todo }
    );
    
    return {
      ...todo,
      id: newId,
      _clientId: generateClientId(), // Track that this was client-modified
    };
  }
  
  return todo;
}

/**
 * useTasks - fetch todos for the current user via /todos/user/:id
 * We read user from authStore (set by ProtectedClient or login)
 */
export function useTasks(): UseQueryResult<TodosResponse, unknown> {
  const user = useAuthStore((s) => s.user);

  const query = useQuery<TodosResponse>({
    queryKey: ["todos", user?.id ?? null],
    queryFn: async () => {
      if (!user?.id) return { todos: [], total: 0 };
      const res = await api.get(`/todos/user/${user.id}`);
      const data = res.data as TodosResponse;
      
      // Check for duplicate IDs in the response
      const idCounts = new Map<number, number>();
      data.todos.forEach((todo) => {
        idCounts.set(todo.id, (idCounts.get(todo.id) || 0) + 1);
      });
      
      // If duplicates found, reassign IDs
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
    // Important: Don't refetch on window focus to preserve client-only todos
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
 * Helper: safe update of the todos cache for user
 */
function updateTodosCacheAppend(qc: ReturnType<typeof useQueryClient>, userId: number, newTodo: Todo) {
  const key = ["todos", userId];
  const prev = qc.getQueryData<TodosResponse>(key);
  
  if (!prev) {
    qc.setQueryData<TodosResponse>(key, { todos: [newTodo], total: 1, skip: 0, limit: 30 });
    return;
  }
  
  // Ensure the new todo has a unique ID
  const uniqueTodo = ensureUniqueId(newTodo, prev.todos);
  
  // Check if already exists (by ID or client ID)
  const exists = prev.todos.some((t) => 
    t.id === uniqueTodo.id || 
    (t._clientId && uniqueTodo._clientId && t._clientId === uniqueTodo._clientId)
  );
  
  if (!exists) {
    qc.setQueryData<TodosResponse>(key, {
      ...prev,
      todos: [uniqueTodo, ...prev.todos],
      total: (typeof prev.total === "number" ? prev.total + 1 : prev.todos.length + 1),
    });
  }
}

function updateTodosCacheRemove(qc: ReturnType<typeof useQueryClient>, userId: number, removedId: number) {
  const key = ["todos", userId];
  const prev = qc.getQueryData<TodosResponse>(key);
  if (!prev) return;
  const newTodos = prev.todos.filter((t) => t.id !== removedId);
  qc.setQueryData<TodosResponse>(key, {
    ...prev,
    todos: newTodos,
    total: typeof prev.total === "number" ? Math.max(0, prev.total - 1) : newTodos.length,
  });
}

/**
 * useCreateTask - creates a todo for the current user
 *
 * IMPORTANT: dummyjson simulates creation and doesn't persist.
 * To show created items in the UI, we append the returned todo to the cached list.
 */
export function useCreateTask(): UseMutationResult<Todo, unknown, { todo: string; completed?: boolean }, unknown> {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation<Todo, unknown, { todo: string; completed?: boolean }>({
    mutationFn: async (payload) => {
      if (!user) throw new Error("Not authenticated");
      const res = await api.post("/todos/add", { ...payload, userId: user.id });
      const createdTodo = res.data as Todo;
      
      // Mark as client-only since DummyJSON doesn't persist
      return {
        ...createdTodo,
        _clientId: generateClientId(),
        _isClientOnly: true, // Flag this as client-only
      };
    },
    onSuccess: (createdTodo) => {
      // Append created todo into the cache for immediate UI reflection
      if (user?.id) updateTodosCacheAppend(qc, user.id, createdTodo);
      // Reset inactivity timer
      window.dispatchEvent(new CustomEvent("resetIdle"));
    },
    onError: (err) => {
      console.error("createTask error:", err);
    },
  });
}

/**
 * useDeleteTask - deletes a todo by id
 *
 * We update cache by removing the deleted item so the UI matches user's action.
 * For client-only todos, we skip the API call and just remove from cache.
 */
export function useDeleteTask(): UseMutationResult<Todo | null, unknown, number, DeleteTaskContext> {
  const qc = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation<Todo | null, unknown, number, DeleteTaskContext>({
    mutationFn: async (id) => {
      // Check if this is a client-only todo
      const key = ["todos", user?.id ?? null];
      const cachedData = qc.getQueryData<TodosResponse>(key);
      const todo = cachedData?.todos.find((t) => t.id === id);
      
      // If it's a client-only todo, don't call the API
      if (todo?._isClientOnly) {
        console.log("Deleting client-only todo, skipping API call:", id);
        return null; // Return null to indicate no server call was made
      }
      
      // Otherwise, call the server
      try {
        const res = await api.delete(`/todos/${id}`);
        return res.data as Todo;
      } catch (err: any) {
        // If 404, the todo doesn't exist on server - treat as client-only
        if (err.response?.status === 404) {
          console.log("Todo not found on server (404), treating as client-only:", id);
          return null;
        }
        throw err; // Re-throw other errors
      }
    },
    onSuccess: (data, id) => {
      window.dispatchEvent(new CustomEvent("resetIdle"));
      
      // If data is null, it was client-only - already removed in onMutate
      if (data === null) {
        console.log("Client-only todo deleted successfully:", id);
      }
    },
    onMutate: async (id): Promise<DeleteTaskContext> => {
      // optimistic update: remove item immediately from cache before server responds
      if (!user?.id) return {};
      
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: ["todos", user.id] });
      
      // snapshot
      const key = ["todos", user.id];
      const previous = qc.getQueryData<TodosResponse>(key);
      
      // Check if this is a client-only todo
      const todo = previous?.todos.find((t) => t.id === id);
      const isClientOnly = todo?._isClientOnly ?? false;
      
      // apply optimistic update
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
      // rollback optimistic update if needed (only for server todos)
      const userId = useAuthStore.getState().user?.id;
      if (context?.previous && userId && !context.isClientOnly) {
        qc.setQueryData<TodosResponse>(["todos", userId], context.previous);
        console.error("deleteTask error, rolling back:", err);
      } else if (context?.isClientOnly) {
        console.log("Error deleting client-only todo (shouldn't happen):", err);
      }
    },
    // Remove onSettled to prevent refetching and losing client-only todos
  });
}