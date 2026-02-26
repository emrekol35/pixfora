"use client";

import { useState, useMemo } from "react";

interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const ENTITIES = ["Tumu", "Order", "Product", "User", "Category", "Brand", "Coupon", "Review", "Page", "Setting"];
const ACTIONS = ["Tumu", "CREATE", "UPDATE", "DELETE", "LOGIN"];

const PAGE_SIZE = 20;

function getActionStyle(action: string): string {
  switch (action.toUpperCase()) {
    case "CREATE":
      return "bg-success/10 text-success";
    case "UPDATE":
      return "bg-primary/10 text-primary";
    case "DELETE":
      return "bg-danger/10 text-danger";
    case "LOGIN":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function ActivityLogViewer({ logs }: { logs: ActivityLog[] }) {
  const [entityFilter, setEntityFilter] = useState("Tumu");
  const [actionFilter, setActionFilter] = useState("Tumu");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (entityFilter !== "Tumu" && log.entity !== entityFilter) return false;
      if (actionFilter !== "Tumu" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesEntityId = log.entityId?.toLowerCase().includes(q);
        const matchesUserName = log.userName.toLowerCase().includes(q);
        if (!matchesEntityId && !matchesUserName) return false;
      }
      return true;
    });
  }, [logs, entityFilter, actionFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="border border-border rounded-lg px-3 py-2 bg-card text-foreground text-sm"
        >
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {e === "Tumu" ? "Varlik: Tumu" : e}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="border border-border rounded-lg px-3 py-2 bg-card text-foreground text-sm"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "Tumu" ? "Aksiyon: Tumu" : a}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Kullanici adi veya Varlik ID ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-border rounded-lg px-3 py-2 bg-card text-foreground text-sm flex-1 min-w-[200px]"
        />

        <span className="text-sm text-muted-foreground">
          {filtered.length} kayit
        </span>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Kayit bulunamadi.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Tarih
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Kullanici
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Aksiyon
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Varlik
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Varlik ID
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Detay
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>{log.userName}</div>
                      {log.userEmail && (
                        <div className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono text-xs">
                      {log.entityId || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.details ? (
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === log.id ? null : log.id
                            )
                          }
                          className="text-primary hover:underline text-xs"
                        >
                          {expandedId === log.id ? "Gizle" : "Goster"}
                        </button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expanded detail rows */}
          {paged.map(
            (log) =>
              expandedId === log.id &&
              log.details && (
                <div
                  key={`detail-${log.id}`}
                  className="border-t border-border bg-muted px-6 py-4"
                >
                  <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Onceki
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
