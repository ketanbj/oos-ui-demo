#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Deploy this app to a public Google Cloud Storage bucket (lowest-cost static hosting path).

Required environment variables:
  PROJECT_ID   GCP project id (example: my-project-1234)

Optional environment variables:
  BUCKET_NAME  Bucket to deploy to (default: ${PROJECT_ID}-oos-ui-demo)
  REGION       Bucket region (default: us-central1)

Example:
  PROJECT_ID=my-project-1234 npm run deploy:gcp:cheap
  PROJECT_ID=my-project-1234 BUCKET_NAME=my-demo-site npm run deploy:gcp:cheap
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
BUCKET_NAME="${BUCKET_NAME:-}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Error: PROJECT_ID is required." >&2
  usage
  exit 1
fi

if [[ -z "${BUCKET_NAME}" ]]; then
  BUCKET_NAME="${PROJECT_ID}-oos-ui-demo"
fi

if ! command -v gcloud >/dev/null 2>&1; then
  echo "Error: gcloud CLI is required. Install from https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required." >&2
  exit 1
fi

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' || true)"
if [[ -z "${ACTIVE_ACCOUNT}" ]]; then
  echo "Error: No active gcloud account. Run: gcloud auth login" >&2
  exit 1
fi

echo "Using gcloud account: ${ACTIVE_ACCOUNT}"
echo "Using project: ${PROJECT_ID}"
echo "Using bucket: gs://${BUCKET_NAME}"
echo "Using region: ${REGION}"

gcloud config set project "${PROJECT_ID}" >/dev/null

if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Creating bucket gs://${BUCKET_NAME}..."
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
else
  echo "Bucket exists, reusing gs://${BUCKET_NAME}"
fi

echo "Configuring bucket for static website hosting..."
gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --web-main-page-suffix=index.html \
  --web-error-page=index.html >/dev/null

echo "Ensuring public read access..."
if ! gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer" >/dev/null 2>&1; then
  echo "Warning: Could not grant public access to allUsers." >&2
  echo "Your org policy may block public buckets. Deploy can still complete for private testing." >&2
fi

echo "Building app..."
npm run build

if [[ ! -d "dist" ]]; then
  echo "Error: dist/ was not created by build." >&2
  exit 1
fi

echo "Syncing dist/ to gs://${BUCKET_NAME}..."
gcloud storage rsync "dist" "gs://${BUCKET_NAME}" \
  --recursive \
  --delete-unmatched-destination-objects

echo "Applying cache-control metadata..."
gcloud storage objects update "gs://${BUCKET_NAME}/index.html" \
  --cache-control="no-cache,max-age=0,must-revalidate" >/dev/null || true
gcloud storage objects update "gs://${BUCKET_NAME}/assets/**" \
  --cache-control="public,max-age=31536000,immutable" >/dev/null || true

cat <<EOF
Deploy complete.

Site URLs:
- HTTP website endpoint (lowest-cost): http://${BUCKET_NAME}.storage.googleapis.com
- HTTPS object endpoint: https://storage.googleapis.com/${BUCKET_NAME}/index.html

Tip:
- Custom domains with managed HTTPS typically require a load balancer, which adds baseline monthly cost.
EOF
