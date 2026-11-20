// Indexes for the sign-up flow (Database Design §4).
// Keep in sync with the `schema.index()` calls in
// src/modules/auth/models/user.model.ts and src/server/rate-limit.ts.

/** @type {Record<string, Array<[Record<string, 1 | -1>, import('mongodb').CreateIndexesOptions?]>>} */
const INDEXES = {
  users: [[{ email: 1 }, { unique: true }]],
  rateLimits: [
    [{ key: 1 }, { unique: true }],
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  ],
};

module.exports = {
  async up(db) {
    for (const [collection, indexes] of Object.entries(INDEXES)) {
      for (const [keys, options] of indexes) {
        await db.collection(collection).createIndex(keys, options ?? {});
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
