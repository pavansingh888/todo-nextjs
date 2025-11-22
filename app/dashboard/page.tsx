"use client";

import ProtectedClient from "../../components/ProtectedClient";
import useInactivity from "../../lib/useInactivity";
import {
  useTasks,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  type Todo,
} from "../../hooks/useTasks";
import { useState } from "react";
import { logoutLocal } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type FilterType = "all" | "pending" | "completed";

/**
 * Small spinner component (keeps styling consistent)
 */
function TinySpinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-[3px] border-slate-600 border-r-transparent"
      aria-hidden
    />
  );
}

export default function DashboardPage() {
  useInactivity();

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useTasks();
  const create = useCreateTask();
  const del = useDeleteTask();
  const update = useUpdateTask();

  // track per-item updating state
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);

  const [text, setText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const addUpdating = (id: number) => setUpdatingIds((s) => (s.includes(id) ? s : [...s, id]));
  const removeUpdating = (id: number) => setUpdatingIds((s) => s.filter((x) => x !== id));
  const isUpdating = (id: number) => updatingIds.includes(id);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // sonner: toast.loading returns an id-like value that can be passed to update the toast
    const id = toast.loading("Adding task...");
    create.mutate(
      { todo: text, completed: false },
      {
        onSuccess: () => {
          toast.success("Task added", { id });
        },
        onError: (err: any) => {
          toast.error("Failed to add task", { id });
          console.error("create error:", err);
        },
      }
    );

    setText("");
  };

  const handleDelete = (todo: Todo) => {
    if (todo._isClientOnly) {
      const key = ["todos", user?.id ?? null];
      const prev = qc.getQueryData<any>(key);
      if (prev) {
        qc.setQueryData(key, {
          ...prev,
          todos: prev.todos.filter((t: Todo) => t.id !== todo.id),
          total: typeof prev.total === "number" ? Math.max(0, prev.total - 1) : prev.todos.length - 1,
        });
      }
      window.dispatchEvent(new CustomEvent("resetIdle"));
      toast.success("Task removed (local)");
      return;
    }

    const id = toast.loading("Deleting task...");
    del.mutate(todo.id, {
      onSuccess: () => {
        toast.success("Task deleted", { id });
      },
      onError: (err: any) => {
        toast.error("Failed to delete task", { id });
        console.error("delete error:", err);
      },
    });
  };

  const handleToggleComplete = (todo: Todo) => {
    if (todo._isClientOnly) {
      const key = ["todos", user?.id ?? null];
      const prev = qc.getQueryData<any>(key);
      if (prev) {
        qc.setQueryData(key, {
          ...prev,
          todos: prev.todos.map((t: Todo) =>
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          ),
        });
      }
      window.dispatchEvent(new CustomEvent("resetIdle"));
      toast.success(todo.completed ? "Marked pending (local)" : "Marked completed (local)");
      return;
    }

    // show loading for this item
    addUpdating(todo.id);
    const id = toast.loading(todo.completed ? "Marking pending..." : "Marking completed...");

    update.mutate(
      { id: todo.id, updates: { completed: !todo.completed } },
      {
        onSuccess: () => {
          toast.success(todo.completed ? "Marked pending" : "Marked completed", { id });
        },
        onError: (err: any) => {
          toast.error("Failed to update", { id });
          console.error("update error:", err);
        },
        onSettled: () => {
          removeUpdating(todo.id);
        },
      }
    );
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.todo);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = (todo: Todo) => {
    if (!editText.trim()) {
      cancelEditing();
      return;
    }

    if (todo._isClientOnly) {
      const key = ["todos", user?.id ?? null];
      const prev = qc.getQueryData<any>(key);
      if (prev) {
        qc.setQueryData(key, {
          ...prev,
          todos: prev.todos.map((t: Todo) =>
            t.id === todo.id ? { ...t, todo: editText } : t
          ),
        });
      }
      window.dispatchEvent(new CustomEvent("resetIdle"));
      toast.success("Updated (local)");
      cancelEditing();
      return;
    }

    addUpdating(todo.id);
    const id = toast.loading("Updating task...");

    update.mutate(
      { id: todo.id, updates: { todo: editText } },
      {
        onSuccess: () => {
          toast.success("Task updated", { id });
          cancelEditing();
        },
        onError: (err: any) => {
          toast.error("Failed to update", { id });
          console.error("update error:", err);
        },
        onSettled: () => {
          removeUpdating(todo.id);
        },
      }
    );
  };

  const handleLogout = async () => {
    await logoutLocal();
    router.push("/login");
    toast.success("Logged out");
  };

  // Filter todos
  const filteredTodos = (data?.todos ?? []).filter((todo) => {
    if (filter === "all") return true;
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const stats = {
    total: data?.todos.length ?? 0,
    pending: (data?.todos ?? []).filter((t) => !t.completed).length,
    completed: (data?.todos ?? []).filter((t) => t.completed).length,
  };

  return (
    <ProtectedClient>
      <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My Tasks</h1>
                {user && (
                  <p className="text-sm text-slate-600 mt-1">
                    Welcome back, <span className="font-semibold">{user.username}</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors text-sm font-medium"
                title="Logout"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-600">Total Tasks</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 shadow-sm border border-amber-200">
                <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
                <div className="text-sm text-amber-700">Pending</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
                <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
            </div>
          </header>

          {/* Add Task Form */}
          <section className="mb-6">
            <form onSubmit={onCreate} className="flex gap-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent bg-white shadow-sm"
                aria-label="New task"
                title="Enter new task"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={create.isPending}
                title="Add task"
                aria-label="Add task"
              >
                <Plus size={20} />
                {create.isPending ? "Adding..." : "Add Task"}
              </button>
            </form>
          </section>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            {(["all", "pending", "completed"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors capitalize ${
                  filter === f ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
                title={`Show ${f} tasks`}
                aria-label={`Show ${f} tasks`}
              >
                {f}
                {f === "pending" && stats.pending > 0 && <span className="ml-2 text-xs">({stats.pending})</span>}
                {f === "completed" && stats.completed > 0 && <span className="ml-2 text-xs">({stats.completed})</span>}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <section>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-800 border-r-transparent"></div>
                <p className="mt-4 text-slate-600">Loading tasks...</p>
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <p className="text-slate-500">{filter === "all" ? "No tasks yet. Create your first task above!" : `No ${filter} tasks.`}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className={`bg-white rounded-lg shadow-sm border transition-all ${
                      todo.completed ? "border-green-200 bg-green-50/50" : "border-slate-200 hover:shadow-md"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            todo.completed ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-slate-400"
                          }`}
                          disabled={isUpdating(todo.id)}
                          title={todo.completed ? "Mark as pending" : "Mark as complete"}
                          aria-label={todo.completed ? "Mark as pending" : "Mark as complete"}
                        >
                          {isUpdating(todo.id) ? (
                            <TinySpinner size={12} />
                          ) : (
                            todo.completed && <Check size={14} className="text-white" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {editingId === todo.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(todo);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
                                autoFocus
                                disabled={isUpdating(todo.id)}
                                title="Edit task"
                                aria-label="Edit task"
                              />
                              <button
                                onClick={() => saveEdit(todo)}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={isUpdating(todo.id)}
                                title={isUpdating(todo.id) ? "Updating..." : "Save"}
                                aria-label="Save"
                              >
                                {isUpdating(todo.id) ? <TinySpinner size={14} /> : <Check size={16} />}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                                disabled={isUpdating(todo.id)}
                                title="Cancel"
                                aria-label="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className={`font-medium ${todo.completed ? "line-through text-slate-500" : "text-slate-900"}`}>
                                {todo.todo}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${todo.completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                  {todo.completed ? "Completed" : "Pending"}
                                </span>
                                {todo._isClientOnly && (
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Local Only</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        {editingId !== todo.id && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => startEditing(todo)}
                              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit"
                              aria-label="Edit task"
                              disabled={isUpdating(todo.id)}
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(todo)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              disabled={del.isPending}
                              title="Delete"
                              aria-label="Delete task"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </ProtectedClient>
  );
}
