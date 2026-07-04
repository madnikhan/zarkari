export interface TrainingSection {
  id: string;
  title: string;
  href: string;
  summary: string;
  steps: { element: string; title: string; description: string }[];
}

export const TRAINING_SECTIONS: TrainingSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/admin/dashboard",
    summary: "See a quick overview of all orders — how many are active, due this week, overdue, and completed.",
    steps: [
      { element: "[data-tour='nav-dashboard']", title: "Dashboard", description: "This is your home screen. Open it anytime from the sidebar or bottom menu." },
      { element: "[data-tour='stat-cards']", title: "Order stats", description: "These cards show totals at a glance. Tap any card to open the full orders list." },
      { element: "[data-tour='recent-orders']", title: "Recent orders", description: "Your latest orders appear here. Tap a row to open full order details." },
    ],
  },
  {
    id: "cash",
    title: "Daily Cash",
    href: "/admin/cash",
    summary: "Record money coming in and going out each day. Track opening balance, deposits, and expenses.",
    steps: [
      { element: "[data-tour='nav-cash']", title: "Daily Cash", description: "Open Daily Cash from the menu to manage today's till." },
      { element: "[data-tour='cash-summary']", title: "Today's summary", description: "See opening balance, cash in, cash out, and closing balance for the selected day." },
      { element: "[data-tour='cash-tables']", title: "Transactions", description: "Tap any description to see full details in a popup." },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    href: "/admin/orders",
    summary: "View and search all bridal orders. Filter by status, supplier, or delivery date.",
    steps: [
      { element: "[data-tour='nav-orders']", title: "Orders list", description: "All bridal orders are listed here with large status badges for easy reading." },
      { element: "[data-tour='new-order']", title: "New order", description: "Tap New Order to create a booking with WhatsApp number, delivery date, deposit, and photos." },
    ],
  },
  {
    id: "new-order",
    title: "New Order",
    href: "/admin/orders/new",
    summary: "Create a new bridal booking. Add customer WhatsApp, dress details, delivery date, deposit, and photos or videos.",
    steps: [
      { element: "[data-tour='whatsapp-field']", title: "WhatsApp number", description: "Enter the customer's WhatsApp number. You can message them directly from the order page." },
      { element: "[data-tour='deposit-field']", title: "Deposit & remaining", description: "Enter how much was paid today. The remaining balance is calculated automatically." },
      { element: "[data-tour='media-upload']", title: "Photos & videos", description: "Take a photo, record a video, record a voice note, or upload from gallery." },
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers",
    href: "/admin/suppliers",
    summary: "Add and manage suppliers. Create login accounts so suppliers can accept orders on their phone.",
    steps: [
      { element: "[data-tour='nav-suppliers']", title: "Suppliers", description: "View supplier performance and manage their details." },
      { element: "[data-tour='add-supplier']", title: "Add supplier", description: "Owners can add new suppliers with name, email, and phone." },
    ],
  },
  {
    id: "inbox",
    title: "Inbox",
    href: "/admin/inbox",
    summary: "Read and reply to customer messages from Facebook, Instagram, WhatsApp, and other channels.",
    steps: [
      { element: "[data-tour='nav-inbox']", title: "Social Inbox", description: "All social inquiries in one place. Unread threads are highlighted." },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    href: "/admin/payments",
    summary: "Track deposits and balance payments across all orders.",
    steps: [
      { element: "[data-tour='nav-payments']", title: "Payments", description: "See payment history and outstanding balances." },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    href: "/admin/reports",
    summary: "View business reports by day, week, month, or year. Print or download as PDF.",
    steps: [
      { element: "[data-tour='nav-reports']", title: "Reports", description: "Switch between time periods and export data." },
    ],
  },
  {
    id: "training",
    title: "Training",
    href: "/admin/training",
    summary: "Learn how to use every part of the system with simple guides and interactive tours.",
    steps: [],
  },
];

export const TRAINING_FAQ = [
  {
    q: "How do I message a customer on WhatsApp?",
    a: "Open any order and tap the green 'Message on WhatsApp' button. It opens WhatsApp with a pre-filled message.",
  },
  {
    q: "How do I add a new supplier?",
    a: "Go to Suppliers → Add Supplier. Fill in their details, then tap 'Create login account' to give them access.",
  },
  {
    q: "How do I install the app on my phone?",
    a: "Look for the purple install banner at the top, or on iPhone use Share → Add to Home Screen in Safari.",
  },
  {
    q: "How do I print a report?",
    a: "On Reports or Cash Analytics, tap 'Print / Save PDF' or 'Download PDF'.",
  },
];
