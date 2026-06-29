import type { SocialMessage, SocialThread } from "./types";

export let demoSocialThreads: SocialThread[] = [
  {
    id: "st-demo-1",
    platform: "instagram",
    externalThreadId: "ig-demo-user-1",
    contactName: "Aisha K.",
    contactHandle: "@aisha_formal",
    status: "open",
    unreadCount: 1,
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    lastMessagePreview: "Do you have Guldaan in size M for August wedding?",
    subject: "Guldaan enquiry",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "st-demo-2",
    platform: "tiktok",
    contactName: "Sara M.",
    contactHandle: "@sara_styles",
    status: "open",
    unreadCount: 1,
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    lastMessagePreview: "Comment on video: How much is Bella Luna gown?",
    subject: "TikTok comment DM",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export let demoSocialMessages: SocialMessage[] = [
  {
    id: "sm-demo-1",
    threadId: "st-demo-1",
    direction: "inbound",
    body: "Do you have Guldaan in size M for August wedding?",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "sm-demo-2",
    threadId: "st-demo-2",
    direction: "inbound",
    body: "Comment on video: How much is Bella Luna gown?",
    metadata: { sourceUrl: "https://tiktok.com/@zarkari/video/example" },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];
