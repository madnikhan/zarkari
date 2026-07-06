export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  type: "bill" | "stock" | "payment";
  orderId?: string;
  description?: string;
  billNumber?: string;
  amountGbp: string;
  amountPkr: string;
  exchangeRate?: string;
  businessDate: string;
  cashTransactionId?: string;
  createdAt: string;
}

export interface SupplierLedgerBalance {
  supplierId: string;
  supplierName: string;
  totalBillsGbp: number;
  totalBillsPkr: number;
  totalPaymentsGbp: number;
  totalPaymentsPkr: number;
  balanceGbp: number;
  balancePkr: number;
}

export let demoSupplierLedger: SupplierLedgerEntry[] = [];
