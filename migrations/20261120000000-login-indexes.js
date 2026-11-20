// Indexes for the login flow (Database Design §4).
// Keep in sync with the `schema.index()` calls in
// src/modules/auth/models/session.model.ts.

/** @type {Record<string, Array<[Record<string, 1 | -1>, import('mongodb').CreateIndexesOptions?]>>} */
const INDEXES = {
  sessions: [
    [{ tokenHash: 1 }, { unique: true }],
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
