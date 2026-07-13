"use client";

import { useState } from "react";
import { createUser, resetPassword, deleteUser } from "@/lib/admin-actions";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/rbac-shared";
import type { Locale } from "@/lib/enums";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantName: string | null;
}

export function AdminUsers({
  users,
  tenants,
  currentUid,
  locale,
}: {
  users: UserRow[];
  tenants: { id: string; name: string }[];
  currentUid: string;
  locale: Locale;
}) {
  const nl = locale === "nl";
  const [role, setRole] = useState<Role>("VIEWER");
  const [msg, setMsg] = useState<string | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{nl ? "Gebruikers" : "Users"}</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">{nl ? "Naam" : "Name"}</th>
              <th className="th">Email</th>
              <th className="th">{nl ? "Rol" : "Role"}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="td font-medium text-slate-800">{u.name}</td>
                <td className="td text-slate-500">{u.email}</td>
                <td className="td">
                  <span className="badge bg-slate-100 text-slate-600">{ROLE_LABELS[u.role as Role]?.[locale] ?? u.role}</span>
                  {u.tenantName && <span className="ml-1 text-xs text-slate-400">→ {u.tenantName}</span>}
                </td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setResetFor(resetFor === u.id ? null : u.id)} className="text-xs text-brand-600 hover:underline">
                      {nl ? "Wachtwoord" : "Password"}
                    </button>
                    {u.id !== currentUid && (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="text-xs text-slate-400 hover:text-red-600">✕</button>
                      </form>
                    )}
                  </div>
                  {resetFor === u.id && (
                    <form
                      action={async (fd) => {
                        await resetPassword(fd);
                        setResetFor(null);
                      }}
                      className="mt-1 flex gap-1"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" type="text" placeholder={nl ? "nieuw wachtwoord" : "new password"} className="rounded border border-slate-200 px-2 py-1 text-xs" />
                      <button type="submit" className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white">OK</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={async (fd) => {
          const res = await createUser(fd);
          setMsg(
            res.error
              ? res.error === "exists"
                ? nl ? "E-mailadres bestaat al." : "Email already exists."
                : res.error === "tenant_required"
                  ? nl ? "Kies een huurder." : "Select a tenant."
                  : nl ? "Ongeldig (wachtwoord ≥ 6 tekens)." : "Invalid (password ≥ 6 chars)."
              : nl ? "Gebruiker toegevoegd." : "User added.",
          );
        }}
        className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5"
      >
        <input name="name" required placeholder={nl ? "Naam" : "Name"} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <input name="email" type="email" required placeholder="email" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r][locale]}</option>
          ))}
        </select>
        {role === "TENANT" ? (
          <select name="tenantId" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <input name="password" type="text" required placeholder={nl ? "wachtwoord" : "password"} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <button type="submit" className="col-span-2 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 sm:col-span-1">
          {nl ? "Toevoegen" : "Add"}
        </button>
        {msg && <span className="col-span-2 text-xs text-slate-500 sm:col-span-5">{msg}</span>}
      </form>
    </section>
  );
}
