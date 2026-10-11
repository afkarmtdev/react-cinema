// Adds four optional fields to the entries collection: "repeats" (the dates
// of rewatches and rereads after the first finish, a JSON list of ISO
// dates), "runtime" (minutes, for films and series), "pages" (for books),
// and "quotes" (passages saved from a book, a JSON list). Applied
// automatically on the next `pocketbase serve`, after
// 1757548800_add_user_favourites.

migrate(
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    entries.fields.add(new JSONField({ name: 'repeats', maxSize: 20000 }));
    entries.fields.add(
      new NumberField({ name: 'runtime', onlyInt: true, min: 0 }),
    );
    entries.fields.add(
      new NumberField({ name: 'pages', onlyInt: true, min: 0 }),
    );
    entries.fields.add(new JSONField({ name: 'quotes', maxSize: 200000 }));
    app.save(entries);
  },
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    for (const name of ['repeats', 'runtime', 'pages', 'quotes']) {
      entries.fields.removeByName(name);
    }
    app.save(entries);
  },
);
