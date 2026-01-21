import React, { useEffect, useState } from "react";
import TradeForm from "./components/TradeForm";
import TradeList from "./components/TradeList";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const has = document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("creatorId="));
    let id;
    if (!has) {
      id = "c_" + Math.random().toString(36).slice(2, 10);
      document.cookie = `creatorId=${id}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } else {
      id = has.split("=")[1];
    }

    (async () => {
      try {
        await fetch(`${API}/session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId: id }),
        });
      } catch (e) {
        console.error("Failed to sync creatorId with backend", e);
      }
    })();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch(`${API}/trades`, { credentials: "include" });
      const data = await res.json();
      setTrades(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleNew = (trade) => {
    setTrades((prev) => [trade, ...prev]);
  };

  const handleDelete = (id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">F76 Trading Hub</h1>
        <TradeForm onCreated={handleNew} api={API} />
        <TradeList trades={trades} onDelete={handleDelete} />
      </div>
    </div>
  );
}
