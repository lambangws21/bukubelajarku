# Firebase helpers

Folder ini berisi helper Firebase untuk:

- `serverStorage.ts`: akses Firebase Storage dari **server** via OAuth2 JWT (tanpa dependency tambahan).
- `admin.ts`: helper Firebase Admin SDK (**butuh** dependency `firebase-admin`).
- `client.ts`: helper Firebase Web SDK (**butuh** dependency `firebase`).

## ENV yang dibutuhkan untuk API Storage (server)

Tambahkan ke `.env.local` (jangan commit):

```
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
```

Catatan: `FIREBASE_PRIVATE_KEY` biasanya perlu `\\n` untuk newline.

## API yang tersedia

- List objek: `GET /api/firebase/storage/list?prefix=&delimiter=/&limit=200`
- Download via proxy server: `GET /api/firebase/storage/download?name=path/to/file.png`

