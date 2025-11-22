"use client";
import { useState } from "react";
import { useLogin } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    login.mutate(
      { username, password, expiresInMins: 60 },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || "Invalid credentials. Please try again.";
          setError(message);
        },
      }
    );
  };

  const hasError = !!error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Login</h1>
        
        <label className="block mb-2">
          <span className="text-sm">Username</span>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            className={`mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
              hasError ? "border-red-300 focus:ring-red-500" : "focus:ring-slate-800"
            }`}
            placeholder="emilys"
            required
          />
        </label>
        
        <label className="block mb-4">
          <span className="text-sm">Password</span>
          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className={`mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 ${
              hasError ? "border-red-300 focus:ring-red-500" : "focus:ring-slate-800"
            }`}
            placeholder="emilyspass"
            type="password"
            required
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </label>
        
        <button
          type="submit"
          className="w-full py-2 rounded bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>
        
        <p className="mt-3 text-sm text-slate-600">
          Use a dummyjson user (e.g. <code className="bg-slate-100 px-1 rounded">emilys</code> / <code className="bg-slate-100 px-1 rounded">emilyspass</code>)
        </p>
      </form>
    </main>
  );
}