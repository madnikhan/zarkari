export interface BridalTermClause {
  title: string;
  body: string;
}

export const BRIDAL_TERMS_ACCEPTANCE =
  "By signing or making a purchase, the customer confirms that they have read, understood, and accepted these Terms and Conditions in full.";

/** Shop bridal order terms — single source of truth for /pages/terms and customer portal. */
export const BRIDAL_TERMS_CLAUSES: BridalTermClause[] = [
  {
    title: "No Returns or Refunds",
    body: "Returns, exchanges, or refunds are not accepted under any circumstances.",
  },
  {
    title: "Design Variations",
    body: "Colour shades, embroidery, and other design elements may vary.",
  },
  {
    title: "Delivery Timeline",
    body: "Delivery timeframe may be extended due to unforeseen circumstances.",
  },
  {
    title: "Fabric Imperfections",
    body: "Minor ink dots, stitching or fabric imperfections may be present and are not considered defects.",
  },
  {
    title: "Collection Deadline",
    body: "Orders must be collected within five (5) days of notification. We accept no responsibility for loss, alteration, or damage thereafter.",
  },
  {
    title: "Inspection on Collection",
    body: "Goods must be inspected prior to leaving the premises.",
  },
  {
    title: "Invoice Requirement",
    body: "No goods will be released without presentation of a valid invoice.",
  },
  {
    title: "Price Variability",
    body: "Our prices fluctuate. No future offer will affect the previous orders.",
  },
  {
    title: "Right to Cancel or Dispose",
    body: "We reserve the right to cancel or dispose of order at our discretion.",
  },
  {
    title: "Customer Responsibility",
    body: "Customers are responsible for providing accurate measurements and confirming all details (size, fabric, colour, design, changes you wanted, accessories) before signing the order.",
  },
  {
    title: "Design Changes",
    body: "Changes to design, colour, fabric, style, or size will incur additional charges.",
  },
  {
    title: "Accessory Charges",
    body: "Additional charges apply for potli bags, scarves, belts, laces, tassels, and other accessories. Goods will not be released without a valid invoice.",
  },
  {
    title: "Deposit Policy",
    body: "A full deposit is required for all orders at the time of placement.",
  },
  {
    title: "Finalised Orders",
    body: "Once an order is finalised, changes will incur extra charges.",
  },
  {
    title: "Tailoring Disclaimer",
    body: "Sizing may vary due to our tailoring method. Garments are made close to the provided measurements but not guaranteed to match them exactly.",
  },
  {
    title: "Fabric Quality Variation",
    body: "Fabric appearance and quality may vary due to the dyeing process.",
  },
  {
    title: "Design Modification Outcome",
    body: "If the original sample design is modified, the final outcome may differ from customer expectations.",
  },
  {
    title: "No Oral Commitments",
    body: "Verbal agreements are not binding unless confirmed in writing.",
  },
  {
    title: "Reference Design Limitation",
    body: "No guarantee is provided for exact replication of designs from pictures or videos.",
  },
  {
    title: "Measurement Disclaimer",
    body: "We are not responsible for measurements provided by the customer or for changes in body size due to weight loss or gain.",
  },
  {
    title: "Collection days",
    body: "Strictly no collection available on Saturday, Sunday, or bank holidays. You can collect from Monday to Friday on an appointment basis.",
  },
];

export function bridalTermsAsHtml(): string {
  const items = BRIDAL_TERMS_CLAUSES.map(
    (c, i) =>
      `<li><strong>${i + 1}. ${escapeHtml(c.title)}:</strong> ${escapeHtml(c.body)}</li>`
  ).join("\n");

  return `
      <p><em>Last updated: July 2026</em></p>
      <p>By placing a bridal or custom order with ZARKARI, you agree to these Terms and Conditions.</p>
      <ol class="bridal-terms-list">
        ${items}
      </ol>
      <p><strong>${escapeHtml(BRIDAL_TERMS_ACCEPTANCE)}</strong></p>
      <h2>Website &amp; payment</h2>
      <p>Online payments are processed securely via Stripe where applicable. These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.</p>
    `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
