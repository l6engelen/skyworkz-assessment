import base64
import json
import logging
import sys
from typing import Any, Dict

logger = logging.getLogger()
handler = logging.StreamHandler(sys.stdout)
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and parse the JSON body from the event.
    Args:
        event: The Lambda event object.
    Returns:
        A parsed JSON dictionary.
    Raises:
        ValueError: If the body is missing or invalid JSON.
    """
    if not event.get("body"):
        return "", "No body provided"

    body = event["body"]
    if event.get("isBase64Encoded", False):
        try:
            body = base64.b64decode(body).decode("utf-8")
        except Exception as e:
            return "", "Failed to decode Base64 body"
    try:
        return json.loads(body), ""
    except json.JSONDecodeError as e:
        return "", "Invalid JSON body"


def parse_parameter(event: Dict[str, Any], parameter_name: str) -> str:
    """Safely retrieves query parameters from the event."""
    if not event.get("queryStringParameters"):
        return ""
    return event.get("queryStringParameters", {}).get(parameter_name, "")


def missing_parameter(parameter: str) -> Dict[str, Any]:
    """Returns a missing parameter response."""
    return {"body": json.dumps({"missing_parameter": parameter}), "statusCode": 400}


def success(body: Dict[str, Any]) -> Dict[str, Any]:
    """Returns a successful response."""
    return {"body": json.dumps(body), "statusCode": 200}


def error(message: str) -> Dict[str, Any]:
    """Returns a failed response."""
    logger.error(message)
    return {"body": json.dumps({"message": message}), "statusCode": 403}
