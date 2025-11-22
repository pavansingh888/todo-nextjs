// /Users/pavan/Desktop/todo-nextjs/app/dashboard/page.tsx
"use client";

import ProtectedClient from "../../components/ProtectedClient";
import useInactivity from "../../lib/useInactivity";
import { useTasks, useCreateTask, useDeleteTask, type Todo } from "../../hooks/useTasks";
import { useState } from "react";
import { logoutLocal } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../stores/authStore";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardPage() {
  useInactivity();

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useTasks();
  const create = useCreateTask();
  const del = useDeleteTask();
  const [text, setText] = useState("");

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    create.mutate({ todo: text, completed: false });
    setText("");
  };

  const handleDelete = (todo: Todo) => {
    // For client-only todos, just update cache directly
    if (todo._isClientOnly) {
      console.log("Deleting client-only todo without API call:", todo.id);
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
      return;
    }
    
    // For server todos, use the mutation
    del.mutate(todo.id);
  };

  const handleLogout = async () => {
    await logoutLocal();
    router.push("/login");
  };

  return (
    <ProtectedClient>
      <main className="min-h-screen p-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">My Tasks</h1>
              {user && (
                <div className="text-sm text-slate-500">
                  Signed in as <strong>{user.username}</strong>
                </div>
              )}
            </div>

            <div>
              <button onClick={handleLogout} className="px-3 py-1 rounded border hover:bg-slate-100">
                Logout
              </button>
            </div>
          </header>

          <section className="mb-6">
            <form onSubmit={onCreate} className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Create new task"
                className="flex-1 rounded border px-3 py-2"
              />
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-slate-800 text-white hover:bg-slate-700"
                disabled={create.isPending}
              >
                {create.isPending ? "Adding..." : "Add"}
              </button>
            </form>
          </section>

          <section>
            {isLoading ? (
              <div>Loading tasks...</div>
            ) : (
              <ul className="space-y-3">
                {(data?.todos ?? []).map((t: Todo) => (
                  <li
                    key={t.id}
                    className="bg-white p-3 rounded shadow flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{t.todo}</div>
                      <div className="text-sm text-slate-500">
                        Completed: {String(t.completed)}
                        {t._isClientOnly && (
                          <span className="ml-2 text-xs text-blue-600">(Local only)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(t)}
                        className="px-3 py-1 rounded border hover:bg-red-50 hover:border-red-300"
                        disabled={del.isPending}
                      >
                        Delete
                      </button>
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