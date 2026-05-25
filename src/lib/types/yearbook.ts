import type { YearbookCoverStyle } from "@/lib/yearbook/cover-styles";
import type { YearbookPageStyle } from "@/lib/yearbook/page-style";

export type Profile = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  university: string | null;
  graduationClass: string | null;
  createdAt: Date;
};

export type Yearbook = {
  id: string;
  ownerId: string;
  shareMode: "link" | "invite_only";
  coverStyle: YearbookCoverStyle;
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
  /** DB references a page image path but the storage object is missing. */
  pageImageMissing?: boolean;
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
