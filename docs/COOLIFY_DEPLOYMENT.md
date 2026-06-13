# Coolify Deployment

Project: `stfrancis-angular`

## Runtime Shape

- `web`: Angular production build served by Nginx.
- `api`: NestJS backend.
- `sfxsai_uploads`: Coolify/Docker persistent volume mounted at `/app/storage`.
- Neon PostgreSQL remains the database through `DATABASE_URL`.

The browser talks to the frontend domain only:

- Angular API base: `/api`
- Nginx proxies `/api/*` to `api:3000/*`
- Nginx proxies `/storage/*` to `api:3000/storage/*`

## Coolify Settings

Create a Docker Compose resource from the GitHub repository:

- Repository: `https://github.com/MABDC-admin/stfrancis-angular.git`
- Branch: `main`
- Compose file: `docker-compose.coolify.yml`
- Public service: `web`
- Public port: `80`

Set these environment variables in Coolify:

```env
DATABASE_URL=<Neon PostgreSQL connection string>
JWT_SECRET=<long random production secret>
```

Do not commit production `.env` files.

## Storage

Coolify's built-in persistent storage should be attached to the `api` service:

- Volume name: `sfxsai_uploads`
- Mount path: `/app/storage`

This stores learner documents, learner photos, staff avatars, and other uploaded files. The Angular container should stay stateless.

## Verification

After deployment:

1. Open the public app URL.
2. Login with a test account.
3. Verify API proxy:
   - `<APP_URL>/api`
   - `<APP_URL>/storage/`
4. Upload a learner photo or staff avatar.
5. Redeploy the app.
6. Confirm the uploaded file still loads from `/storage/...`.
