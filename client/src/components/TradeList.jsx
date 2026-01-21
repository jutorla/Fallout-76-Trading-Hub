import React from "react";
import { ITEM_GROUPS } from "../itemGroups";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function formatRelative(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (mins) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);
  if (parts.length === 0) return "just now";

  return parts.join(", ") + " ago";
}

function TradeItem({ t }) {
  return (
    <div className="border p-2 rounded mb-1 pr-20 text-sm[#1f1e1d] text-[#c7974b] border-[#c7974b]/20">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-sm text-[#c7974b]">{t.type}</div>
          <div className="text-xs text-[#c7974b]/70">
            {formatRelative(t.createdAt)}
          </div>
        </div>
        <div className="text-xs flex gap-3 items-center text-[#c7974b]">
          {t.ingameUser && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                In-game
              </span>
              <span className="truncate max-w-[8rem]">{t.ingameUser}</span>
            </div>
          )}
          {t.discordUser && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs">
                Discord
              </span>
              <span className="truncate max-w-[8rem]">{t.discordUser}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="font-medium text-xs">I have</div>
          <div className="truncate">
            {t.item1} {t.description1} <span className="mx-2">×</span>{" "}
            {t.quantity1}
          </div>
        </div>
        <div>
          <div className="font-medium text-xs">I want</div>
          <div className="truncate">
            {t.item2} {t.description2} <span className="mx-2">×</span>{" "}
            {t.quantity2}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradeList({ trades: allTrades, onDelete }) {
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(8);
  const [descQuery, setDescQuery] = React.useState("");
  const [group, setGroup] = React.useState("all");
  const [groupItem, setGroupItem] = React.useState("all");
  const [sort, setSort] = React.useState("newest");

  if (!allTrades || allTrades.length === 0)
    return <div className="text-gray-600">No trades yet.</div>;

  const filtered = allTrades.filter((t) => {
    const dq = descQuery.toLowerCase();
    const currentGroup =
      group === "all" ? null : ITEM_GROUPS.find((g) => g.label === group);
    const selectedItem = groupItem === "all" ? null : groupItem.toLowerCase();
    const tItem1 = (t.item1 || "").toLowerCase();
    const tItem2 = (t.item2 || "").toLowerCase();

    let byGroup = true;
    if (currentGroup) {
      if (selectedItem) {
        byGroup = tItem1 === selectedItem || tItem2 === selectedItem;
      } else {
        const groupItems = new Set(
          currentGroup.items.map((it) => it.toLowerCase()),
        );
        byGroup = groupItems.has(tItem1) || groupItems.has(tItem2);
      }
    }

    const byDesc = !dq
      ? true
      : (t.description1 || "").toLowerCase().includes(dq) ||
        (t.description2 || "").toLowerCase().includes(dq);

    return byGroup && byDesc;
  });

  const sorted = filtered.slice().sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    return 0;
  });

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const pageItems = sorted.slice(start, start + perPage);

  const myCreatorId = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("creatorId="))
    ?.split("=")[1];

  const handleRemove = async (id) => {
    try {
      const res = await fetch(`${API}/trades/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof onDelete === "function") onDelete(id);
      } else {
        console.error("Delete failed", data);
        alert(data.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  };

  return (
    <div>
      <div className="mb-3 flex gap-2 items-center">
        <select
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setGroupItem("all");
            setPage(1);
          }}
          className="p-2 rounded[#1f1e1d] text-[#c7974b] border border-[#c7974b]/30"
        >
          <option value="all">All items</option>
          {ITEM_GROUPS.map((g) => (
            <option
              key={g.label}
              value={g.label}
              className="bg-[#1f1e1d] text-[#c7974b]"
            >
              {g.label}
            </option>
          ))}
        </select>
        {group !== "all" && (
          <select
            value={groupItem}
            onChange={(e) => {
              setGroupItem(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded[#1f1e1d] text-[#c7974b] border border-[#c7974b]/30"
          >
            <option value="all">All in {group}</option>
            {ITEM_GROUPS.find((g) => g.label === group)?.items.map((it) => (
              <option
                key={it}
                value={it}
                className="bg-[#1f1e1d] text-[#c7974b]"
              >
                {it}
              </option>
            ))}
          </select>
        )}
        <input
          value={descQuery}
          onChange={(e) => {
            setDescQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search description"
          className="p-2 rounded[#1f1e1d] text-[#c7974b] border border-[#c7974b]/30 flex-1"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="p-2 rounded[#1f1e1d] text-[#c7974b] border border-[#c7974b]/30"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <div className="max-h-80 overflow-auto">
        {(() => {
          const order = ["WTS", "WTB", "WTT"];
          const grouped = {};
          pageItems.forEach((t) => {
            grouped[t.type] = grouped[t.type] || [];
            grouped[t.type].push(t);
          });

          return order.map((type) => {
            const list = grouped[type] || [];
            if (list.length === 0) return null;
            return (
              <div key={type} className="mb-3">
                <div className="text-sm font-semibold mb-1">
                  {type} ({list.length})
                </div>
                <div className="space-y-1">
                  {list.map((t) => (
                    <div key={t.id} className="relative">
                      <TradeItem t={t} />
                      {t.creatorId && myCreatorId === t.creatorId && (
                        <button
                          onClick={() => handleRemove(t.id)}
                          className="absolute top-2 right-2 text-sm text-red-600 border border-red-200 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-primary">
          Showing {start + 1}-{Math.min(start + perPage, total)} of {total}
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-secondary px-3 py-1 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="btn-secondary px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
