import {
  STORE_ADDRESS_LINES,
  STORE_PHONE_DISPLAY,
  STORE_SITE_URL,
} from "@/lib/brand/store-contact";
import { formatPrice } from "@/lib/utils";

export type StoreInvoiceLine = {
  description: string;
  quantity?: number;
  amount: string;
};

export type StoreInvoiceData = {
  serialNo: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  descriptionLines: StoreInvoiceLine[];
  collectionLabel: string;
  totalAmount: string;
  deposit: string;
  balance: string;
  paymentCash: boolean;
  paymentOnline: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function moneyLabel(amount: string): string {
  const formatted = formatPrice(amount);
  return formatted.startsWith("£") ? formatted.slice(1) : formatted;
}

function paymentBox(checked: boolean, label: string): string {
  return `<label class="pay"><span class="box">${checked ? "✓" : ""}</span> ${escapeHtml(label)}</label>`;
}

export function renderStoreInvoiceHtml(data: StoreInvoiceData): string {
  const descHtml = data.descriptionLines.length
    ? data.descriptionLines
        .map((line) => {
          const qty = line.quantity && line.quantity > 1 ? ` × ${line.quantity}` : "";
          return `<div class="desc-line"><span>${escapeHtml(line.description)}${qty}</span><span class="amt">${escapeHtml(formatPrice(line.amount))}</span></div>`;
        })
        .join("")
    : `<div class="desc-line"><span>—</span><span></span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Invoice ${escapeHtml(data.orderNumber)} — Zarkari</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; background: #f5f5f5; }
  .sheet { max-width: 520px; margin: 24px auto; background: #fff; border: 1px solid #ddd; padding: 28px 28px 0; }
  .brand { text-align: center; font-family: system-ui, sans-serif; font-size: 28px; letter-spacing: 0.35em; font-weight: 600; text-transform: uppercase; margin: 0 0 8px; }
  .contact { text-align: center; font-family: system-ui, sans-serif; font-size: 12px; color: #444; line-height: 1.5; margin-bottom: 16px; }
  .wave { height: 10px; background: linear-gradient(90deg, #1a1a1a 0%, #c4a574 50%, #1a1a1a 100%); border-radius: 2px; margin: 12px 0 20px; }
  .title { text-align: center; background: #ececec; font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.25em; padding: 8px; margin-bottom: 18px; }
  .row { display: flex; gap: 12px; margin-bottom: 12px; font-family: system-ui, sans-serif; font-size: 13px; align-items: baseline; }
  .row label { min-width: 120px; font-weight: 600; color: #333; }
  .row .val { flex: 1; border-bottom: 1px solid #ccc; padding: 2px 0; min-height: 1.4em; }
  .desc-block { margin: 8px 0 16px; font-family: system-ui, sans-serif; font-size: 13px; }
  .desc-block > label { font-weight: 600; display: block; margin-bottom: 6px; }
  .desc-line { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px dotted #ddd; padding: 6px 0; }
  .desc-line .amt { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .money { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 16px 0; font-family: system-ui, sans-serif; font-size: 12px; }
  .money .box { border: 1px solid #333; padding: 10px 8px; text-align: center; }
  .money .box strong { display: block; font-size: 14px; margin-top: 4px; }
  .pay-row { display: flex; gap: 20px; align-items: center; margin: 14px 0; font-family: system-ui, sans-serif; font-size: 13px; flex-wrap: wrap; }
  .pay-row > span { font-weight: 600; min-width: 120px; }
  .pay { display: inline-flex; align-items: center; gap: 6px; }
  .pay .box { display: inline-flex; width: 16px; height: 16px; border: 1px solid #333; align-items: center; justify-content: center; font-size: 11px; }
  .footer { margin: 28px -28px 0; background: #1a1a1a; color: #f5f0e8; text-align: center; padding: 12px; font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: 0.04em; }
  .footer a { color: #f5f0e8; text-decoration: none; }
  .actions { max-width: 520px; margin: 12px auto 32px; display: flex; gap: 8px; justify-content: center; font-family: system-ui, sans-serif; }
  .actions button { border: 1px solid #ccc; background: #fff; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
  @media print {
    body { background: #fff; }
    .sheet { border: none; margin: 0; max-width: none; }
    .actions { display: none !important; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <h1 class="brand">Zarkari</h1>
    <div class="contact">
      ${STORE_ADDRESS_LINES.map((l) => escapeHtml(l)).join("<br/>")}<br/>
      ☎ ${escapeHtml(STORE_PHONE_DISPLAY)}
    </div>
    <div class="wave"></div>
    <div class="title">INVOICE</div>

    <div class="row"><label>S.No</label><div class="val">${escapeHtml(data.serialNo)}</div></div>
    <div class="row"><label>Date</label><div class="val">${escapeHtml(data.date)}</div></div>
    <div class="row"><label>Order No</label><div class="val">${escapeHtml(data.orderNumber)}</div></div>
    <div class="row"><label>Name</label><div class="val">${escapeHtml(data.customerName)}</div></div>

    <div class="desc-block">
      <label>Description</label>
      ${descHtml}
    </div>

    <div class="row"><label>Collection</label><div class="val">${escapeHtml(data.collectionLabel)}</div></div>

    <div class="money">
      <div class="box">Total Amount £<strong>${escapeHtml(moneyLabel(data.totalAmount))}</strong></div>
      <div class="box">Deposit<strong>£${escapeHtml(moneyLabel(data.deposit))}</strong></div>
      <div class="box">Balance<strong>£${escapeHtml(moneyLabel(data.balance))}</strong></div>
    </div>

    <div class="pay-row">
      <span>Payment Method</span>
      ${paymentBox(data.paymentCash, "Cash")}
      ${paymentBox(data.paymentOnline, "Online")}
    </div>

    <div class="row"><label>Customer Contact #</label><div class="val">${escapeHtml(data.customerPhone ?? "—")}</div></div>
    <div class="row"><label>Signature</label><div class="val"></div></div>

    <div class="footer">
      <a href="${STORE_SITE_URL}">🌐 ${STORE_SITE_URL.replace(/^https?:\/\//, "")}</a>
    </div>
  </div>
  <div class="actions">
    <button type="button" onclick="window.print()">Print</button>
  </div>
</body>
</html>`;
}
