"use client";

import { useState } from "react";
import { createIssue } from "@/lib/actions";
import {
  type Locale,
  ISSUE_CATEGORY,
  ISSUE_PRIORITY,
  ISSUE_RAISED_BY,
  ISSUE_CATEGORY_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_RAISED_BY_LABELS,
  label,
} from "@/lib/enums";

export function NewIssueForm({ propertyId, locale }: { propertyId: string; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const l = {
    add: locale === "nl" ? "+ Nieuwe melding" : "+ New issue",
    title: locale === "nl" ? "Titel" : "Title",
    category: locale === "nl" ? "Categorie" : "Category",
    priority: locale === "nl" ? "Prioriteit" : "Priority",
    raisedBy: locale === "nl" ? "Gemeld door" : "Raised by",
    cost: locale === "nl" ? "Kosten (€)" : "Cost (€)",
    save: locale === "nl" ? "Opslaan" : "Save",
    cancel: locale === "nl" ? "Annuleren" : "Cancel",
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
      >
        {l.add}
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await createIssue(fd);
        setOpen(false);
      }}
      className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input
        name="title"
        required
        placeholder={l.title}
        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select name="category" label={l.category} options={ISSUE_CATEGORY} labels={ISSUE_CATEGORY_LABELS} locale={locale} />
        <Select name="priority" label={l.priority} options={ISSUE_PRIORITY} labels={ISSUE_PRIORITY_LABELS} locale={locale} />
        <Select name="raisedBy" label={l.raisedBy} options={ISSUE_RAISED_BY} labels={ISSUE_RAISED_BY_LABELS} locale={locale} />
        <input name="cost" type="number" min="0" step="50" placeholder={l.cost} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
          {l.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
          {l.cancel}
        </button>
      </div>
    </form>
  );
}

function Select({
  name,
  label: lbl,
  options,
  labels,
  locale,
}: {
  name: string;
  label: string;
  options: readonly string[];
  labels: Record<string, { nl: string; en: string }>;
  locale: Locale;
}) {
  return (
    <select name={name} aria-label={lbl} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
      {options.map((o) => (
        <option key={o} value={o}>
          {label(labels, o, locale)}
        </option>
      ))}
    </select>
  );
}
