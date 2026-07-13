"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "@/lib/auth-actions";
import type { Locale } from "@/lib/enums";

function SubmitButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

export function LoginForm({ locale, from }: { locale: Locale; from?: string }) {
  const [state, action] = useFormState<LoginState, FormData>(login, {});
  const nl = locale === "nl";
  return (
    <form action={action} className="space-y-3">
      {from && <input type="hidden" name="from" value={from} />}
      <input
        name="email"
        type="email"
        required
        placeholder="email"
        autoComplete="username"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <input
        name="password"
        type="password"
        required
        placeholder={nl ? "wachtwoord" : "password"}
        autoComplete="current-password"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      {state.error && (
        <p className="text-xs text-red-600">
          {state.error === "invalid"
            ? nl
              ? "Onjuist e-mailadres of wachtwoord."
              : "Incorrect email or password."
            : nl
              ? "Vul e-mailadres en wachtwoord in."
              : "Enter email and password."}
        </p>
      )}
      <SubmitButton label={nl ? "Inloggen" : "Sign in"} busy={nl ? "Bezig…" : "Signing in…"} />
    </form>
  );
}
