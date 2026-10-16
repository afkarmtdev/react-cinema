// Adds "moods" to the entries collection: how the entry made the user feel,
// a JSON list of mood names (joy, cried, mad, scared, moved, bored). Applied
// automatically on the next `pocketbase serve`, after
// 1791676800_add_repeats_length_quotes.

migrate(
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    entries.fields.add(new JSONField({ name: 'moods', maxSize: 2000 }));
    app.save(entries);
  },
  (app) => {
    const entries = app.findCollectionByNameOrId('entries');
    entries.fields.removeByName('moods');
    app.save(entries);
  },
);
