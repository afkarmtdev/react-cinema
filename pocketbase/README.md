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
5. In the app, open the Storage setting: on the Login screen tap "Advanced",
   or when signed in go to the Me tab, Settings, Advanced. Choose "PocketBase
   server" and enter the address using the LAN IP of the machine running
   PocketBase, for example `http://192.168.1.20:8090`. Find the IP with
   `ipconfig` (Windows) or `ifconfig` / `ip addr` (macOS, Linux). Tap "Test
   connection" to check the phone can reach it, then "Switch storage". If you
   were signed in, the app signs you out first.

   To make a fresh install start in server mode without visiting the
   setting, put the address in `.env` as `EXPO_PUBLIC_POCKETBASE_URL` (copy
   `.env.example`) and restart Metro with `npx expo start -c`. That value is
   only the first-launch default; a choice saved in the app wins over it.

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

Entries saved in device mode are still in the app's local storage on that
device, and switching back to "This device" shows them again. There is no
automatic upload to the server yet; re-add them, or ask for an import step.

## Running it somewhere permanent

A laptop that is asleep is not a server. For always-on sync, run the same
binary on a small VPS or a Raspberry Pi and put the public address in `.env`.
Use https in front of it (Caddy or the built-in `--https` flags) before
exposing it to the internet.
