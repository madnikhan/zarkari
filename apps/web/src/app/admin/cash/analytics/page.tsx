import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>;
}

export default async function CashAnalyticsRedirectPage({ searchParams }: Props) {
  const { preset, from, to } = await searchParams;
  const qs = new URLSearchParams({ tab: "cash" });
  if (preset) qs.set("preset", preset);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  redirect(`/admin/reports?${qs.toString()}`);
}
