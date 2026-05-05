import React from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, Clock, AlertCircle, ShieldAlert } from "lucide-react";
import { Helmet } from "react-helmet-async";

function AdminHelmet() {
  return (
    <Helmet>
      <title>Admin — AEO Improvement</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  plan: string;
  auditCount: number;
  lastAudit: string | null;
  avgScore: number | null;
}

interface AdminUsersResponse {
  totalUsers: number;
  totalAudits: number;
  audits24h: number;
  audits7d: number;
  users: AdminUser[];
}

function StatCard({ icon: Icon, label, value, hint }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d ago`;
  return d.toLocaleDateString();
}

function displayName(u: AdminUser): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (u.email?.split("@")[0] ?? "Unnamed");
}

export default function Admin() {
  const query = useQuery<AdminUsersResponse>({
    queryKey: ["admin", "users"],
    queryFn: () => customFetch<AdminUsersResponse>("/api/admin/users"),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <AdminHelmet />
        <div className="h-8 w-40 bg-muted/50 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (query.isError) {
    const status = (query.error as { status?: number } | null)?.status;
    return (
      <div className="flex-1 w-full max-w-md mx-auto p-8 mt-16 text-center space-y-4">
        <AdminHelmet />
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">{status === 403 ? "Admin access required" : "Could not load admin"}</h1>
        <p className="text-muted-foreground text-sm">
          {status === 403
            ? "Your account isn't on the admin list. Contact the site owner to add your email to ADMIN_EMAILS."
            : "Something went wrong loading admin data. Please try again."}
        </p>
      </div>
    );
  }

  const data = query.data!;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <AdminHelmet />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">User accounts and audit activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} />
        <StatCard icon={BarChart3} label="Total audits" value={data.totalAudits} />
        <StatCard icon={Clock} label="Audits (24h)" value={data.audits24h} />
        <StatCard icon={Clock} label="Audits (7d)" value={data.audits7d} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Showing the {data.users.length} most recent signups</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <span>No users have signed up yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Signed up</th>
                    <th className="px-4 py-3 font-semibold text-right">Audits</th>
                    <th className="px-4 py-3 font-semibold text-right">Avg AEO</th>
                    <th className="px-4 py-3 font-semibold">Last audit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {(u.email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{displayName(u)}</span>
                            <span className="text-xs text-muted-foreground font-mono">{u.email ?? "(no email)"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium capitalize">{u.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">{u.auditCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u.avgScore ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.lastAudit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
