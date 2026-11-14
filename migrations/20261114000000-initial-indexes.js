// Initial indexes for the 12 domain collections (Database Design §4 + scaffold decisions).
// Keep in sync with the `schema.index()` calls in src/modules/*/models;
// `npm run db:check-indexes` reports any drift.
// rateLimits indexes ship later with the auth feature.

const DAY = 24 * 60 * 60;

/** @type {Record<string, Array<[Record<string, 1 | -1>, import('mongodb').CreateIndexesOptions?]>>} */
const INDEXES = {
  users: [[{ email: 1 }, { unique: true }]],
  sessions: [
    [{ tokenHash: 1 }, { unique: true }],
    [{ userId: 1 }],
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  ],
  passwordResets: [
    [{ tokenHash: 1 }, { unique: true }],
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  ],
  weddings: [
    [{ slug: 1 }, { unique: true }],
    [{ "previousSlugs.slug": 1 }],
    [{ status: 1 }, { partialFilterExpression: { status: "deleting" } }],
  ],
  memberships: [
    [{ weddingId: 1, userId: 1 }, { unique: true }],
    [{ userId: 1 }],
  ],
  teamInvites: [
    [{ tokenHash: 1 }, { unique: true }],
    [{ weddingId: 1, createdAt: -1 }],
  ],
  events: [[{ weddingId: 1, date: 1, startTime: 1 }]],
  guests: [
    [{ weddingId: 1, nameLower: 1 }],
    [{ weddingId: 1, invited: 1 }],
    [{ weddingId: 1, group: 1 }],
    [{ weddingId: 1, eventIds: 1 }],
  ],
  invitations: [[{ weddingId: 1 }, { unique: true }]],
  photos: [
    [{ weddingId: 1, eventId: 1, createdAt: -1 }],
    [{ status: 1, createdAt: 1 }],
  ],
  todos: [[{ weddingId: 1, done: 1, dueDate: 1 }]],
  notifications: [
    [
      { userId: 1, refId: 1, type: 1, threshold: 1 },
      {
        unique: true,
        partialFilterExpression: { threshold: { $exists: true } },
      },
    ],
    [{ userId: 1, read: 1, createdAt: -1 }],
    [
      { readAt: 1 },
      { expireAfterSeconds: 90 * DAY, partialFilterExpression: { read: true } },
    ],
  ],
};

module.exports = {
  async up(db) {
    for (const [collection, indexes] of Object.entries(INDEXES)) {
      for (const [keys, options = {}] of indexes) {
        await db.collection(collection).createIndex(keys, options);
      }
    }
  },

  async down(db) {
    for (const [collection, indexes] of Object.entries(INDEXES)) {
      for (const [keys] of indexes) {
        await db
          .collection(collection)
          .dropIndex(keys)
          .catch((error) => {
            // IndexNotFound / NamespaceNotFound: already gone.
            if (error.code !== 27 && error.code !== 26) throw error;
          });
      }
    }
  },
};
