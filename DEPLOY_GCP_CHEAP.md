# Cheapest GCP Deployment (Static Bucket)

This project is a Vite static app, so the cheapest GCP path is a public Google Cloud Storage bucket with static website hosting.

## Why this path

- No always-on compute service.
- Very low cost for light traffic.
- One-command redeploy after setup.

## Prerequisites

- A GCP project with billing enabled.
- `gcloud` CLI installed and authenticated:
  - `gcloud auth login`
  - `gcloud auth application-default login` (optional, useful for local tooling)
- Permission to create/update buckets and IAM in the target project.

## Deploy

From the repo root:

```bash
PROJECT_ID=your-project-id npm run deploy:gcp:cheap
```

Optional overrides:

```bash
PROJECT_ID=your-project-id \
BUCKET_NAME=your-unique-bucket-name \
REGION=us-central1 \
npm run deploy:gcp:cheap
```

What the script does:

1. Builds the app with `npm run build`.
2. Creates the bucket if needed.
3. Enables static website behavior (`index.html` as main/error page).
4. Grants public read (if org policy allows).
5. Syncs `dist/` to the bucket.

## Cost guardrails

- Keep `REGION` in a low-cost US region (default is `us-central1`).
- Avoid external HTTP(S) load balancers unless you need custom-domain HTTPS.
- Watch egress in Billing reports as traffic grows.

## Notes

- The built-in bucket website endpoint is HTTP:
  - `http://<bucket>.storage.googleapis.com`
- HTTPS is available via object URL:
  - `https://storage.googleapis.com/<bucket>/index.html`
- For production custom domain + HTTPS, budget for load balancer costs.
