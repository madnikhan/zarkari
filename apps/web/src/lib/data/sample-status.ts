import { cache } from "react";
import { countSampleOrdersDb } from "@/lib/db/bridal-orders";
import { countSampleCashRows } from "@/lib/db/cash-ledger";

export const hasSampleData = cache(async (): Promise<boolean> => {
  if (process.env.SHOW_SAMPLE_BANNER === "false") return false;
  const [orders, cash] = await Promise.all([countSampleOrdersDb(), countSampleCashRows()]);
  return orders > 0 || cash > 0;
});
