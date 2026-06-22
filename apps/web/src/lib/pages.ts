export interface StaticPage {
  slug: string;
  title: string;
  description: string;
  content: string;
}

export const staticPages: StaticPage[] = [
  {
    slug: "about",
    title: "Our Story",
    description: "The heritage and vision behind ZARKARI designer formal wear.",
    content: `
      <p>ZARKARI brings exquisite designer formal wear to the discerning woman in the United Kingdom.</p>
      <p>Each piece in our catalogue is selected for its quality, artistry, and timeless elegance — hand-finished designer gowns and occasionwear for weddings, Eid, and celebrations.</p>
      <p>We believe that heritage craft and modern grace belong together. Based in the United Kingdom, we serve clients who appreciate the artistry of South Asian designer fashion.</p>
    `,
  },
  {
    slug: "shipping",
    title: "Shipping",
    description: "UK and international delivery information for ZARKARI orders.",
    content: `
      <h2>United Kingdom</h2>
      <ul>
        <li><strong>Royal Mail 2nd Class:</strong> £3.99 (3–5 business days). Free on orders over £75.</li>
        <li><strong>Royal Mail 1st Class:</strong> £5.99 (1–2 business days).</li>
        <li><strong>DPD Next Day:</strong> £9.99 (order before 2pm).</li>
      </ul>
      <h2>International</h2>
      <p>We ship worldwide via DHL International. Delivery times and costs are calculated at checkout based on your destination.</p>
      <h2>Order Processing</h2>
      <p>Orders are processed within 1–2 business days. You will receive a tracking number once your order ships.</p>
    `,
  },
  {
    slug: "returns",
    title: "Returns & Exchanges",
    description: "ZARKARI return and exchange policy for UK customers.",
    content: `
      <p>We want you to love your ZARKARI purchase. If you're not completely satisfied, you may return unworn items with original tags within 14 days of delivery.</p>
      <h2>How to Return</h2>
      <ol>
        <li>Email us at returns@zarkari.co.uk with your order number.</li>
        <li>We will provide a returns label and instructions.</li>
        <li>Once received and inspected, refunds are processed within 5–7 business days.</li>
      </ol>
      <h2>Exchanges</h2>
      <p>We offer free exchanges for a different size, subject to availability. Contact us within 14 days of delivery.</p>
    `,
  },
  {
    slug: "contact",
    title: "Contact Us",
    description: "Get in touch with the ZARKARI team.",
    content: `
      <p>We'd love to hear from you. Whether you have a question about sizing, an order, or our catalogue — our team is here to help.</p>
      <ul>
        <li><strong>Email:</strong> hello@zarkari.co.uk</li>
        <li><strong>WhatsApp:</strong> Available via the chat button on our website</li>
      </ul>
      <p>We aim to respond to all enquiries within 24 hours during business days (Monday–Friday, 9am–5pm GMT).</p>
    `,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How ZARKARI collects, uses, and protects your personal data under UK GDPR.",
    content: `
      <p><em>Last updated: June 2026</em></p>
      <h2>Who We Are</h2>
      <p>ZARKARI is a UK-based designer clothing brand. We are the data controller for personal information collected through our website.</p>
      <h2>What We Collect</h2>
      <ul>
        <li>Name, email, phone number, and delivery address when you place an order</li>
        <li>Payment information (processed securely by Stripe — we do not store card details)</li>
        <li>Website usage data via cookies and analytics (with your consent)</li>
      </ul>
      <h2>How We Use Your Data</h2>
      <ul>
        <li>To process and fulfil your orders</li>
        <li>To communicate about your order and provide customer support</li>
        <li>To send marketing emails (only with your consent — unsubscribe anytime)</li>
        <li>To improve our website and services through analytics</li>
      </ul>
      <h2>Your Rights</h2>
      <p>Under UK GDPR, you have the right to access, correct, delete, or restrict processing of your personal data. Contact hello@zarkari.co.uk to exercise these rights.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies for site functionality and, with your consent, analytics and marketing cookies. You can manage preferences via our cookie banner.</p>
    `,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    description: "Terms and conditions for shopping at ZARKARI.",
    content: `
      <p><em>Last updated: June 2026</em></p>
      <p>By using the ZARKARI website and placing an order, you agree to these terms.</p>
      <h2>Products & Pricing</h2>
      <p>All prices are shown in GBP and include UK VAT where applicable. We reserve the right to correct pricing errors.</p>
      <h2>Orders</h2>
      <p>An order confirmation email constitutes acceptance of your order. We may cancel orders in cases of stock unavailability or suspected fraud.</p>
      <h2>Payment</h2>
      <p>Payment is processed securely via Stripe. We accept major credit/debit cards, Apple Pay, and Google Pay.</p>
      <h2>Intellectual Property</h2>
      <p>All content on this website — including images, text, and branding — is the property of ZARKARI and may not be reproduced without permission.</p>
      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.</p>
    `,
  },
];

export function getPageBySlug(slug: string): StaticPage | undefined {
  return staticPages.find((p) => p.slug === slug);
}
