import type { YearbookPageStyle } from "@/lib/yearbook/page-style";

export type Profile = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  university: string | null;
  graduationClass: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export type Yearbook = {
  id: string;
  ownerId: string;
  shareMode: "link" | "invite_only";
  createdAt: Date;
};

export type YearbookEntry = {
  id: string;
  yearbookId: string;
  authorId: string | null;
  authorName: string;
  authorUniversity: string | null;
  authorClass: string | null;
  contentText: string;
  imageUrls: string[];
  pdfUrl: string | null;
  pageImageUrl: string | null;
  styleConfig: YearbookPageStyle;
  createdAt: Date;
  isVisibleToOwner: boolean;
};

export type YearbookInvite = {
  id: string;
  yearbookId: string;
  invitedUserId: string;
  invitedUsername: string;
  invitedAt: Date;
};
