// Types for migrate() and Collection come from pb_data/types.d.ts once PocketBase
// has run; that folder is git-ignored, so no reference directive here.

// Creates the "entries" collection that CineReact stores its library in.
// PocketBase applies this automatically on the next `pocketbase serve` when
// this file sits in the pb_migrations folder next to the binary.
//
// Written for the PocketBase 0.23+ migration API (collections have `fields`,
// request data is `@request.body`). The API rules restrict every operation to
// rows owned by the signed-in user.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    const entries = new Collection({
      name: 'entries',
      type: 'base',
      listRule: 'owner = @request.auth.id',
      viewRule: 'owner = @request.auth.id',
      createRule:
        "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule: 'owner = @request.auth.id',
      deleteRule: 'owner = @request.auth.id',
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'kind',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['film', 'series', 'book'],
        },
        { name: 'title', type: 'text', required: true, max: 300 },
        { name: 'year', type: 'number', onlyInt: true },
        { name: 'creator', type: 'text', max: 300 },
        { name: 'description', type: 'text', max: 10000 },
        { name: 'poster', type: 'text', max: 2000 },
        { name: 'tags', type: 'json', maxSize: 20000 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['want', 'inProgress', 'done'],
        },
        { name: 'rating', type: 'number', min: 0, max: 10 },
        { name: 'review', type: 'text', max: 20000 },
        { name: 'finishedAt', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_entries_owner ON entries (owner)'],
    });

    app.save(entries);
  },
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    app.delete(entries);
  },
);
