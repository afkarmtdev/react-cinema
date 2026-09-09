# PocketBase for CineReact

CineReact can keep accounts and the library on a PocketBase server instead of
on the device, so the same library shows up on every phone you sign in from.
PocketBase is a single binary with SQLite inside; nothing else to install.

## One-time setup

1. Download PocketBase for your platform from https://pocketbase.io/docs/
   (version 0.23 or newer) and unzip it into this folder. The binary and its
   `pb_data` folder are git-ignored.
2. Start it:

   ```
   ./pocketbase serve --http=0.0.0.0:8090
   ```

   On Windows: `.\pocketbase.exe serve --http=0.0.0.0:8090`. The `0.0.0.0`
   makes it reachable from a phone on the same Wi-Fi, not just from this
   machine.

3. On first start it prints a link to create the superuser account. Open it
   and set one up. The dashboard is at http://127.0.0.1:8090/_/ afterwards.
4. The migration in `pb_migrations/` runs automatically and creates the
   `entries` collection. Check the dashboard: you should see `users` and
   `entries` under Collections. If `entries` is missing, run
   `./pocketbase migrate up` once and restart.
5. Put the server address in the app's `.env` (copy `.env.example` if you do
   not have one), using the LAN IP of the machine running PocketBase:

   ```
   EXPO_PUBLIC_POCKETBASE_URL=http://192.168.1.20:8090
   ```

   Find the IP with `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS,
   Linux). Restart Metro with `npx expo start -c` after changing `.env`.

6. Sign up in the app. Accounts now live in PocketBase's `users` collection,
   so a login from another device sees the same library.

## How the schema maps

| App field     | PocketBase field                                      |
| ------------- | ----------------------------------------------------- |
| `ownerId`     | `owner` (relation, users)                             |
| `kind`        | `kind` (select)                                       |
| `title`       | `title` (text)                                        |
| `year`        | `year` (number, 0 = unset)                            |
| `creator`     | `creator` (text)                                      |
| `description` | `description` (text)                                  |
| `poster`      | `poster` (text, a URL)                                |
| `tags`        | `tags` (json array)                                   |
| `status`      | `status` (select)                                     |
| `rating`      | `rating` (number 1.0 to 10.0, one decimal, 0 = unset) |
| `review`      | `review` (text)                                       |
| `finishedAt`  | `finishedAt` (date)                                   |
| `createdAt`   | `created` (autodate)                                  |
| `updatedAt`   | `updated` (autodate)                                  |

The API rules on `entries` only let a signed-in user list, view, create,
update, and delete rows whose `owner` is their own id. The app-side mapping is
in `src/lib/pocketbase.ts`.

## Moving your existing device-only library

Entries saved before switching are still in the app's local storage on that
device, but the app reads from PocketBase once the URL is set. There is no
automatic upload yet; re-add them, or ask for an import step.

## Running it somewhere permanent

A laptop that is asleep is not a server. For always-on sync, run the same
binary on a small VPS or a Raspberry Pi and put the public address in `.env`.
Use https in front of it (Caddy or the built-in `--https` flags) before
exposing it to the internet.
