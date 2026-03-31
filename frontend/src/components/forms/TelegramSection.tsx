import { useCallback, useEffect, useRef, useState } from "react";
import Card, { CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import apiClient from "@/api/client";

interface Status { linked: boolean; chat_id: number | null }
interface Token  { token: string; expires_in: number }

export default function TelegramSection() {
  const [status, setStatus] = useState<Status | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await apiClient.get<Status>("/telegram/status");
      setStatus(data);
      if (data.linked) { setToken(null); setRemaining(0); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Poll every 5 s while a token is active
  useEffect(() => {
    if (token && remaining > 0) {
      pollRef.current = setInterval(fetchStatus, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [token, remaining, fetchStatus]);

  // Countdown timer
  useEffect(() => {
    if (remaining <= 0) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [remaining]);

  const generateToken = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<Token>("/telegram/generate-link-token");
      setToken(data);
      setRemaining(data.expires_in);
    } finally { setLoading(false); }
  };

  const unlink = async () => {
    setLoading(true);
    try { await apiClient.delete("/telegram/unlink"); await fetchStatus(); }
    finally { setLoading(false); }
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <Card>
      <CardTitle>Telegram Bot</CardTitle>

      <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
        {status?.linked ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-green-500">&#10003;</span> Telegram Connected
              <span className="text-xs text-gray-500 dark:text-gray-400">(chat {status.chat_id})</span>
            </span>
            <Button variant="danger" size="sm" disabled={loading} onClick={unlink}>Unlink</Button>
          </div>
        ) : token && remaining > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-gray-100 px-3 py-2 font-mono text-xs dark:bg-gray-700">{token.token}</code>
              <Button variant="secondary" size="sm" onClick={copy}>{copied ? "Copied!" : "Copy"}</Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expires in {mm}:{ss}</p>
            <ol className="list-inside list-decimal space-y-1 text-xs">
              <li>Open Telegram and find <strong>@YourBotName</strong></li>
              <li>Send: <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">/link {token.token}</code></li>
              <li>Come back here — the status will update automatically</li>
            </ol>
          </>
        ) : (
          <>
            <p>Connect your Telegram account to log expenses on the go.</p>
            <Button size="sm" disabled={loading} onClick={generateToken}>Generate Link Token</Button>
          </>
        )}

        <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">Message format reference</p>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600 dark:text-gray-400">{
`Quick add: 50 groceries lunch at cafe
Income: +5000 salary
Commands: /budget, /recent, /help`}</pre>
        </div>
      </div>
    </Card>
  );
}
