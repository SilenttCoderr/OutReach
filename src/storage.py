"""Storage module for Cloudflare R2 / AWS S3 compatibility."""

import os
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from typing import Optional

# Configuration
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "cold-email-outreach")

# Initialize S3 client for R2
def get_s3_client():
    if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY or not R2_ENDPOINT_URL:
        return None
    
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    )

def upload_file(file_obj, object_name: str, content_type: str = "text/csv") -> Optional[str]:
    """Upload a file-like object to R2 bucket."""
    s3_client = get_s3_client()
    if not s3_client:
        print("Warning: R2 credentials not configured. Skipping upload.")
        return None

    try:
        s3_client.upload_fileobj(
            file_obj,
            R2_BUCKET_NAME,
            object_name,
            ExtraArgs={'ContentType': content_type}
        )
        # Return public URL if public, or just the object key
        # For private buckets, maybe return pre-signed URL?
        # R2 public access URL:
        public_url_base = os.getenv("R2_PUBLIC_URL")
        if public_url_base:
            return f"{public_url_base}/{object_name}"
        return object_name
    except ClientError as e:
        print(f"Error uploading to R2: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error uploading to R2: {e}")
        return None

def generate_presigned_url(object_name: str, expiration=3600) -> Optional[str]:
    """Generate a presigned URL to share an S3 object."""
    s3_client = get_s3_client()
    if not s3_client:
        return None

    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET_NAME, 'Key': object_name},
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        return None
