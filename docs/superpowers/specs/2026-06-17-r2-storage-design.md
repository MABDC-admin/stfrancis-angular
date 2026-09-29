# Cloudflare R2 Storage Design

## Goal

Move learner photos, staff avatars, and uploaded documents off VPS-local file storage and into Cloudflare R2 while keeping the current NestJS upload endpoints and the existing `StoredFile` metadata model intact.

## Current State

- The backend accepts uploads through `src/storage/storage.controller.ts`.
- Files are written to a temporary local path by Multer, then moved into `STORAGE_DIR` by `StorageService`.
- Metadata is written to the `StoredFile` table through Prisma.
- Public file URLs currently assume local static serving through `/storage/<relativePath>`.
- Docker on the VPS persists local files in the `sfxsai_uploads` volume.

## Target Design

### Storage provider model

The backend will support two storage providers:

- `local`: existing filesystem-backed storage
- `r2`: Cloudflare R2-backed object storage

Provider selection will be controlled through environment variables. The upload API surface will remain unchanged.

### Object persistence

When `STORAGE_PROVIDER=r2`:

1. Multer still writes to a temporary local file.
2. `StorageService` uploads that file to the configured R2 bucket using the S3-compatible API.
3. The temp file is deleted after a successful upload.
4. `StoredFile.relativePath` continues to hold the canonical object key.
5. `StoredFile.publicUrl` points to a backend content endpoint instead of a raw bucket URL by default.

This avoids forcing the bucket to be public and keeps reads working even before a custom R2 domain is added.

### Read path

Add a backend file-content endpoint:

- `GET /storage/files/:id/content`

Behavior:

- Look up the `StoredFile` record by id.
- For `local`, read and stream from disk.
- For `r2`, fetch and stream the object from Cloudflare R2.
- Return the stored MIME type and content length when available.
- Return `404` when the metadata row or object is missing.

This endpoint becomes the default `publicUrl` generator for new uploads.

### Delete path

Deleting a stored file will remove both:

- the metadata row in Postgres
- the underlying file/object from the active storage provider

### R2 configuration

Required environment variables:

- `STORAGE_PROVIDER`
- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Optional:

- `R2_REGION` defaulting to `auto`
- `R2_PUBLIC_BASE_URL` for future direct-public delivery if a custom domain is attached

### Deployment impact

- Database remains on VPS Postgres primary with Neon replication unchanged.
- The local uploads Docker volume becomes non-authoritative for new uploads when R2 is enabled, but it is still used for request temp files unless reworked later.
- Existing local file URLs remain valid for previously uploaded local assets.

## Error Handling

- Reject unsupported MIME types exactly as today.
- Fail the request if the R2 upload fails; do not create a DB row in that case.
- Best-effort cleanup of temp files on validation or upload failure.
- Surface `404` for missing content records or missing objects.

## Testing

Add tests for:

- provider selection and URL generation helpers
- R2 upload path storing metadata and deleting temp files
- R2 delete path removing the object
- content streaming path resolving a stored file and returning the provider payload

## Scope Boundaries

Included:

- backend storage provider integration
- env/config updates for VPS deployment
- bucket provisioning/verification for the chosen R2 bucket

Excluded:

- browser direct uploads with presigned URLs
- bulk migration of old VPS-local files into R2
- public custom-domain setup for R2 delivery
