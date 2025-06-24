"""
Orphaned File Cleanup Script

Deletes S3 folders under uploads/{uuid}/ that are older than 30 minutes
and have no matching session in the user_sessions table.
Supports dry-run mode for safe testing.
"""

import logging
import os
from datetime import datetime, timezone

import boto3
import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "safqores-maria")
S3_UPLOAD_PREFIX = "uploads/"
DRY_RUN = os.environ.get("ORPHANED_CLEANUP_DRY_RUN", "true").lower() == "true"
AGE_THRESHOLD_MINUTES = int(os.environ.get("ORPHANED_CLEANUP_AGE_MINUTES", "30"))

# Database config from environment
DB_HOST = os.environ.get("POSTGRES_HOST", "localhost")
DB_PORT = int(os.environ.get("POSTGRES_PORT", "5432"))
DB_NAME = os.environ.get("POSTGRES_DB", "maria_db")
DB_USER = os.environ.get("POSTGRES_USER", "maria_user")
DB_PASS = os.environ.get("POSTGRES_PASSWORD", "maria")

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("orphaned_file_cleanup")


def get_valid_session_uuids():
    """Fetch all valid session UUIDs from the user_sessions table."""
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
    )
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT uuid FROM user_sessions")
            rows = cur.fetchall()
            return set(str(row["uuid"]) for row in rows)
    finally:
        conn.close()


def list_s3_folders_older_than(s3, bucket, prefix, min_age_minutes):
    """Yield (uuid, last_modified) for folders older than min_age_minutes."""
    paginator = s3.get_paginator("list_objects_v2")
    now = datetime.now(timezone.utc)
    seen_uuids = set()
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
        for cp in page.get("CommonPrefixes", []):
            folder = cp["Prefix"]
            # Remove prefix and trailing slash
            uuid = folder[len(prefix) : -1]
            if not uuid or uuid in seen_uuids:
                continue
            seen_uuids.add(uuid)
            # Find oldest file in this folder
            files = s3.list_objects_v2(Bucket=bucket, Prefix=folder)
            oldest = now
            for obj in files.get("Contents", []):
                lm = obj["LastModified"]
                if lm < oldest:
                    oldest = lm
            age_minutes = (now - oldest).total_seconds() / 60
            if age_minutes >= min_age_minutes:
                yield uuid, folder, oldest, age_minutes


def list_base_files_older_than(s3, bucket, prefix, min_age_minutes):
    """
    Yield (key, last_modified, age_minutes) for files directly under prefix
    (not in subfolders) older than min_age_minutes.
    """
    now = datetime.now(timezone.utc)
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            # Only consider files directly under uploads/ (no nested folders)
            if key == prefix or "/" in key[len(prefix) :]:
                continue
            lm = obj["LastModified"]
            age_minutes = (now - lm).total_seconds() / 60
            if age_minutes >= min_age_minutes:
                yield key, lm, age_minutes


def delete_s3_folder(s3, bucket, folder):
    """Delete all objects under the given folder prefix."""
    to_delete = s3.list_objects_v2(Bucket=bucket, Prefix=folder)
    if "Contents" not in to_delete:
        return 0
    objects = [{"Key": obj["Key"]} for obj in to_delete["Contents"]]
    # S3 delete_objects can only delete up to 1000 objects at a time
    for i in range(0, len(objects), 1000):
        s3.delete_objects(Bucket=bucket, Delete={"Objects": objects[i : i + 1000]})
    return len(objects)


def main():
    logger.info(f"Starting orphaned file cleanup (dry-run={DRY_RUN})")
    s3 = boto3.client("s3")
    valid_uuids = get_valid_session_uuids()
    logger.info(f"Loaded {len(valid_uuids)} valid session UUIDs from DB.")
    deleted_count = 0
    # Clean up orphaned UUID folders
    for uuid, folder, oldest, age_minutes in list_s3_folders_older_than(
        s3, S3_BUCKET, S3_UPLOAD_PREFIX, AGE_THRESHOLD_MINUTES
    ):
        valid_uuids = get_valid_session_uuids()
        if uuid in valid_uuids:
            logger.info(f"Skipping {folder}: UUID {uuid} is now valid.")
            continue
        msg = (
            f"Orphaned folder {folder} "
            f"(UUID={uuid}, age={age_minutes:.1f} min, oldest={oldest})"
        )
        if DRY_RUN:
            logger.info(f"[DRY-RUN] Would delete: {msg}")
        else:
            num = delete_s3_folder(s3, S3_BUCKET, folder)
            logger.info(f"Deleted {num} objects in {msg}")
            deleted_count += num
    # Clean up legacy files in uploads/ base
    for key, lm, age_minutes in list_base_files_older_than(
        s3, S3_BUCKET, S3_UPLOAD_PREFIX, AGE_THRESHOLD_MINUTES
    ):
        msg = f"Legacy file {key} (age={age_minutes:.1f} min, last_modified={lm})"
        if DRY_RUN:
            logger.info(f"[DRY-RUN] Would delete: {msg}")
        else:
            s3.delete_object(Bucket=S3_BUCKET, Key=key)
            logger.info(f"Deleted {msg}")
            deleted_count += 1
    logger.info(f"Cleanup complete. Total deleted: {deleted_count}")


if __name__ == "__main__":
    main()
