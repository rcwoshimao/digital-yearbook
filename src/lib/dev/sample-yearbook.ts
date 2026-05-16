import type { YearbookEntry, YearbookInvite } from "@/lib/types/yearbook";
import type { YearbookPageStyle } from "@/lib/yearbook/page-style";

export const sampleUsers = {
  user1: {
    id: "11111111-1111-4111-8111-111111111111",
    displayName: "User 1",
    email: "rebeccachencjy@gmail.com",
    username: "user1",
    university: "Sample University",
    graduationClass: "2026",
  },
  user2: {
    id: "22222222-2222-4222-8222-222222222222",
    displayName: "User 2",
    email: "mantoumiaoshen@gmail.com",
    username: "user2",
    university: "Sample University",
    graduationClass: "2026",
  },
} as const;

const sampleStyles = {
  blush: {
    background_color: "#fdecea",
    pattern: "dotted",
    font: "handwritten",
    ink_color: "#4a1a1a",
    border: "corner",
  },
  mint: {
    background_color: "#e8f5f0",
    pattern: "grid",
    font: "mono",
    ink_color: "#1a3a2a",
    border: "double",
  },
  sky: {
    background_color: "#e8f0fd",
    pattern: "lined",
    font: "serif",
    ink_color: "#1a2e4a",
    border: "classic",
  },
  sunflower: {
    background_color: "#fdf8e1",
    pattern: "grid",
    font: "serif",
    ink_color: "#1a3a2a",
    border: "corner",
  },
} satisfies Record<string, YearbookPageStyle>;

export const sampleYearbooks = {
  user1: {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ownerId: sampleUsers.user1.id,
    shareMode: "link" as const,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
  },
  user2: {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ownerId: sampleUsers.user2.id,
    shareMode: "link" as const,
    createdAt: new Date("2026-05-01T12:05:00.000Z"),
  },
} as const;

export const sampleEntries: YearbookEntry[] = [
  {
    id: "eeeeeeee-1111-4111-8111-111111111111",
    yearbookId: sampleYearbooks.user2.id,
    authorId: sampleUsers.user1.id,
    authorName: sampleUsers.user1.displayName,
    authorUniversity: sampleUsers.user1.university,
    authorClass: sampleUsers.user1.graduationClass,
    contentText:
      "Mantou, thanks for making senior year brighter. I hope your next chapter is full of good food, good friends, and ridiculous stories.",
    imageUrls: [],
    styleConfig: sampleStyles.sky,
    createdAt: new Date("2026-05-15T16:00:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-2222-4222-8222-222222222222",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: sampleUsers.user2.displayName,
    authorUniversity: sampleUsers.user2.university,
    authorClass: sampleUsers.user2.graduationClass,
    contentText:
      "Rebecca, you made every project feel possible. I am cheering for you always, class of 2026 forever!",
    imageUrls: [],
    styleConfig: sampleStyles.blush,
    createdAt: new Date("2026-05-15T16:05:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-3333-4333-8333-333333333333",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Mia Chen",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "Rebecca, your late-night debugging playlists deserve their own campus legend. Thank you for making every deadline feel a little less scary.",
    imageUrls: [],
    styleConfig: sampleStyles.mint,
    createdAt: new Date("2026-05-15T16:06:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-4444-4444-8444-444444444444",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Jordan Lee",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "I will never forget the way you turned our messy idea into a real demo. Keep building things that make people smile.",
    imageUrls: [],
    styleConfig: sampleStyles.sky,
    createdAt: new Date("2026-05-15T16:07:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-5555-4555-8555-555555555555",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Avery Patel",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "From coffee runs to capstone chaos, you always brought calm energy. I hope post-grad life gives you the same kindness you gave everyone else.",
    imageUrls: [],
    styleConfig: sampleStyles.blush,
    createdAt: new Date("2026-05-15T16:08:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-6666-4666-8666-666666666666",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Sam Rivera",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "You made study group feel like a team, not a panic room. Thank you for explaining the hard parts and laughing through the weird parts.",
    imageUrls: [],
    styleConfig: sampleStyles.sunflower,
    createdAt: new Date("2026-05-15T16:09:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-7777-4777-8777-777777777777",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Taylor Kim",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "Your yearbook needs a page for all the tiny wins: fixed bugs, shared snacks, perfect timing, and somehow always finding a seat in the library.",
    imageUrls: [],
    styleConfig: sampleStyles.blush,
    createdAt: new Date("2026-05-15T16:10:00.000Z"),
    isVisibleToOwner: true,
  },
  {
    id: "eeeeeeee-8888-4888-8888-888888888888",
    yearbookId: sampleYearbooks.user1.id,
    authorId: sampleUsers.user2.id,
    authorName: "Noah Brooks",
    authorUniversity: "Sample University",
    authorClass: "2026",
    contentText:
      "You are the person everyone wanted on their project team: thoughtful, prepared, and secretly hilarious. Congratulations on everything.",
    imageUrls: [],
    styleConfig: sampleStyles.mint,
    createdAt: new Date("2026-05-15T16:11:00.000Z"),
    isVisibleToOwner: true,
  },
];

export const sampleInvites: YearbookInvite[] = [
  {
    id: "99999999-1111-4111-8111-111111111111",
    yearbookId: sampleYearbooks.user1.id,
    invitedUserId: sampleUsers.user2.id,
    invitedUsername: sampleUsers.user2.username,
    invitedAt: new Date("2026-05-15T15:00:00.000Z"),
  },
];

export function getSampleRecipient(yearbookId: string) {
  if (yearbookId === sampleYearbooks.user1.id) {
    return sampleUsers.user1;
  }

  if (yearbookId === sampleYearbooks.user2.id) {
    return sampleUsers.user2;
  }

  return null;
}

export function getSampleYearbook(yearbookId: string) {
  if (yearbookId === sampleYearbooks.user1.id) {
    return sampleYearbooks.user1;
  }

  if (yearbookId === sampleYearbooks.user2.id) {
    return sampleYearbooks.user2;
  }

  return null;
}
