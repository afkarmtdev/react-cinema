// Adds the optional "startedAt" date to the entries collection, so an entry
// can record when the user began it as well as when they finished. Applied
// automatically on the next `pocketbase serve`, after 1757376000_create_entries.

migrate(
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    entries.fields.add(new DateField({ name: 'startedAt' }));
    app.save(entries);
  },
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    entries.fields.removeByName('startedAt');
    app.save(entries);
  },
);
