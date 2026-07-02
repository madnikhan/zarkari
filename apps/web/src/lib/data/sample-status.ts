import { countSampleOrdersDb } from "@/lib/db/bridal-orders";
import { countSampleCashRows } from "@/lib/db/cash-ledger";

export async function hasSampleData(): Promise<boolean> {
  const [orders, cash] = await Promise.all([countSampleOrdersDb(), countSampleCashRows()]);
  return orders > 0 || cash > 0;
}
