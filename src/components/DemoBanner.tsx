import type { Locale } from "@/lib/enums";

export function DemoBanner({ locale }: { locale: Locale }) {
  const text =
    locale === "nl"
      ? "Demo-omgeving — alle panden, huurders en bedragen zijn fictief en dienen alleen ter illustratie."
      : "Demo environment — all properties, tenants and amounts are fictional and for illustration only.";
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-1.5 text-center text-xs font-medium text-amber-800">
      {text}
    </div>
  );
}
