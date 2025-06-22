import boto3
import os

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME')

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def migrate_s3_files(old_uuid: str, new_uuid: str) -> None:
    """
    Move all files in S3 from uploads/{old_uuid}/ to uploads/{new_uuid}/.
    """
    paginator = s3_client.get_paginator('list_objects_v2')
    prefix = f'uploads/{old_uuid}/'
    for page in paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=prefix):
        for obj in page.get('Contents', []):
            old_key = obj['Key']
            filename = old_key.split(prefix, 1)[-1]
            new_key = f'uploads/{new_uuid}/{filename}'
            s3_client.copy_object(Bucket=S3_BUCKET_NAME, CopySource={'Bucket': S3_BUCKET_NAME, 'Key': old_key}, Key=new_key)
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=old_key)
