import type { YearbookEntry, YearbookInvite } from "@/lib/types/yearbook";

export const sampleUsers = {
  user1: {
    id: "11111111-1111-4111-8111-111111111111",
    displayName: "User 1",
    email: "rebeccachencjy@gmail.com",
    university: "Sample University",
    graduationClass: "2026",
  },
  user2: {
    id: "22222222-2222-4222-8222-222222222222",
    displayName: "User 2",
    email: "mantoumiaoshen@gmail.com",
    university: "Sample University",
    graduationClass: "2026",
  },
} as const;

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
    createdAt: new Date("2026-05-15T16:05:00.000Z"),
    isVisibleToOwner: true,
  },
];

export const sampleInvites: YearbookInvite[] = [
  {
    id: "99999999-1111-4111-8111-111111111111",
    yearbookId: sampleYearbooks.user1.id,
    invitedUserId: sampleUsers.user2.id,
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
