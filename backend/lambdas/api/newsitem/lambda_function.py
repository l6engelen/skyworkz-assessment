from datetime import datetime, timezone
import os
import uuid

from api_utils import error, parse_json_body, success
import boto3

dynamodb = boto3.resource("dynamodb")

EXPECTED_FIELDS = {"title", "description"}
OPTIONAL_FIELDS = {"thumbnail_key"}


def validate_body(body):
    """
    Validate the request body.
    Args:
        body: The parsed request body.
    Returns:
        A tuple (is_valid, error_message).
    """
    missing_fields = EXPECTED_FIELDS - body.keys()
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    extra_fields = body.keys() - EXPECTED_FIELDS - OPTIONAL_FIELDS
    if extra_fields:
        return False, f"Unexpected fields provided: {', '.join(extra_fields)}"

    if not body["title"].strip():
        return False, "Title cannot be empty"
    if not body["description"].strip():
        return False, "Description cannot be empty"

    return True, ""


def create_news_item(news_item):
    """
    Create a new news item in the DynamoDB table.
    """
    table = dynamodb.Table(os.environ["NEWS_TABLE_NAME"])
    news_item["partitionKey"] = "news"
    news_item["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    table.put_item(Item=news_item)
    return news_item


def handler(event, context):
    """
    Lambda handler to create a new news item.
    """
    body, message = parse_json_body(event)
    if not body:
        return error(message)

    validated, message = validate_body(body)
    if not validated:
        return error(message)

    try:
        news_item = create_news_item(body)
    except Exception as e:
        return error("Failed to create newsitem")

    return success(
        {
            "news_item": news_item,
        }
    )
