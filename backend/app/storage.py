
from supabase import create_client
from app.config import settings


# Connect to Supabase Storage
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SECRET_KEY
)

# Storage bucket
BUCKET_NAME = settings.SUPABASE_BUCKET


def upload_file(file_path: str, file_bytes: bytes, content_type: str):
    """Upload a file to Supabase Storage."""

    return supabase.storage.from_(BUCKET_NAME).upload(
        path=file_path,
        file=file_bytes,
        file_options={
            "content-type": content_type,
            "upsert": "true"
        }
    )


def download_file(file_path: str):
    """Download the complete file from Supabase Storage."""

    return supabase.storage.from_(BUCKET_NAME).download(file_path)


def create_file_signed_url(
    file_path: str,
    expires_in: int = 3600
):
    """Generate a temporary signed URL for direct file access."""

    response = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        file_path,
        expires_in
    )

    signed_url = response.get("signedURL")

    if not signed_url:
        raise RuntimeError("Supabase did not return a signed URL")

    # Handle both relative and absolute signed URLs.
    if signed_url.startswith("https://") or signed_url.startswith("http://"):
        return signed_url

    if signed_url.startswith("/storage/v1/"):
        return f"{settings.SUPABASE_URL}{signed_url}"

    return f"{settings.SUPABASE_URL}/storage/v1{signed_url}"


def delete_file(file_path: str):
    """Delete a file from Supabase Storage."""

    return supabase.storage.from_(BUCKET_NAME).remove([file_path])
