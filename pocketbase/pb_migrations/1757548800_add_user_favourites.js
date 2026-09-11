// Adds the "favourites" list to the users collection: the entry ids on the
// user's top four shelf, kept in order. The profile picture uses the
// "avatar" file field that PocketBase gives every auth collection, so
// nothing to add for it. Applied automatically on the next
// `pocketbase serve`, after 1757462400_add_started_at.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.add(new JSONField({ name: 'favourites', maxSize: 2000 }));
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.removeByName('favourites');
    app.save(users);
  },
);
