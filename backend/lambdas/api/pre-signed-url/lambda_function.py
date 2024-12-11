import json
import os
import uuid

from api_utils import error, missing_parameter, parse_parameter, success
import boto3

s3_client = boto3.client("s3", endpoint_url="https://s3.eu-west-1.amazonaws.com")


def handler(event, context):
    filename = parse_parameter(event, "filename")
    if not filename:
        return missing_parameter("filename")

    upload_prefix = os.environ["UPLOADS_FOLDER"]
    unique_filename = f"{uuid.uuid4()}_{filename}"
    try:
        response = s3_client.generate_presigned_post(
            Bucket=os.environ["BUCKET_NAME"],
            Key=f"{upload_prefix}/{uuid.uuid4()}_{filename}",
            ExpiresIn=3600,
        )
    except Exception as e:
        return error("An error occurred while generating the pre-signed URL: " + str(e))

    return success({"url": response["url"], "fields": response["fields"], "key": unique_filename})
