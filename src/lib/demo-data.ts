import type { YearbookEntry } from "@/lib/types/yearbook";
import { defaultYearbookPageStyle } from "@/lib/yearbook/page-style";

export const demoEntries: YearbookEntry[] = [
  {
    id: "demo-entry-1",
    yearbookId: "demo-yearbook",
    authorId: "demo-author-1",
    authorName: "Avery Chen",
    authorUniversity: "Example University",
    authorClass: "Class of 2026",
    contentText:
      "Congratulations on graduating. I am so grateful for all the late-night study sessions and campus coffee runs.",
    imageUrls: [],
    styleConfig: defaultYearbookPageStyle,
    createdAt: new Date("2026-05-15T12:00:00Z"),
    isVisibleToOwner: true,
  },
  {
    id: "demo-entry-2",
    yearbookId: "demo-yearbook",
    authorId: "demo-author-2",
    authorName: "Jordan Lee",
    authorUniversity: "Example University",
    authorClass: "Class of 2026",
    contentText:
      "You made every group project better. Wishing you the best in the next chapter.",
    imageUrls: [],
    styleConfig: defaultYearbookPageStyle,
    createdAt: new Date("2026-05-16T12:00:00Z"),
    isVisibleToOwner: true,
  },
];
