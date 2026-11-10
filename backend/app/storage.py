
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
    """Download a file from Supabase Storage."""

    return supabase.storage.from_(BUCKET_NAME).download(file_path)


def delete_file(file_path: str):
    """Delete a file from Supabase Storage."""

    return supabase.storage.from_(BUCKET_NAME).remove([file_path])
