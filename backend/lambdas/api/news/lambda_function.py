import os

from api_utils import error, parse_parameter, success
import boto3

dynamodb = boto3.resource("dynamodb")

# def list_news_items(table, limit=None, start_key=None):
#     """
#     Retrieve paginated news items from the DynamoDB table.
#     Args:
#         table: The DynamoDB table resource.
#         limit (int): The maximum number of items to return.
#         start_key (dict): The LastEvaluatedKey from the previous scan/query.
#     Returns:
#         tuple: A tuple containing the list of news items and the LastEvaluatedKey for the next page.
#     """
#     scan_params = {}
#     if start_key:
#         scan_params["ExclusiveStartKey"] = start_key
#     if limit:
#         scan_params["Limit"] = limit

#     response = table.scan(**scan_params)
#     items = response.get("Items", [])
#     next_key = response.get("LastEvaluatedKey")

#     return items, next_key


def list_news_items(table, limit=None, start_key=None):
    """
    Retrieve paginated news items from the DynamoDB table using the DateIndex GSI.
    Args:
        table: The DynamoDB table resource.
        limit (int): The maximum number of items to return.
        start_key (dict): The LastEvaluatedKey from the previous query.
    Returns:
        tuple: A tuple containing the list of news items and the LastEvaluatedKey for the next page.
    """
    query_params = {
        "KeyConditionExpression": "#pk = :pk_value",
        "ExpressionAttributeNames": {"#pk": "partitionKey"},
        "ExpressionAttributeValues": {":pk_value": "news"},
        "ScanIndexForward": False,
    }
    if start_key:
        query_params["ExclusiveStartKey"] = start_key
    if limit:
        query_params["Limit"] = limit

    response = table.query(**query_params)
    items = response.get("Items", [])
    next_key = response.get("LastEvaluatedKey")

    return items, next_key


def handler(event, context):
    limit = parse_parameter(event, "limit")
    start_key = parse_parameter(event, "start_key")

    if limit:
        try:
            limit = int(limit)
        except ValueError:
            return error("Invalid limit parameter. Limit must be an integer.")

    if start_key:
        try:
            start_key = eval(start_key)
        except Exception:
            return error("Invalid start_key parameter. Must be a valid dictionary.")

    table = dynamodb.Table(os.environ["NEWS_TABLE_NAME"])
    news_items, next_key = list_news_items(table, limit, start_key)

    return success({"news_items": news_items, "next_key": next_key})
