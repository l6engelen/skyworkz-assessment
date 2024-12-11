import json
from urllib.parse import urlencode, urljoin

import requests


def process_response(response):
    if response.status_code == 200:
        print("API call successful. Response:")
        print(response.json())
    else:
        print(f"Failed to invoke API. Status code: {response.status_code}")
        print(response.text)
    return


def request_get(url, headers=None):
    response = requests.get(url, headers=headers)
    return process_response(response)


def request_post(url, data, headers=None):
    response = requests.post(url, data=json.dumps(data), headers=headers)
    return process_response(response)


stage = "api"
api_id = "mvprx0of0m"
base_url = f"https://{api_id}.execute-api.eu-west-1.amazonaws.com"


def ping():
    endpoint = "ping"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_get(endpoint_url)


def news():
    endpoint = "news"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_get(endpoint_url)


def newsitem(item):
    endpoint = "newsitem"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_post(endpoint_url, item)


def pre_signed_url():
    endpoint = "pre-signed-url"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    query_params = {"filename": "test.jpg"}
    full_endpoint_url = f"{endpoint_url}?{urlencode(query_params)}"
    request_get(full_endpoint_url)


ping()
news()
# pre_signed_url()

data = {"title": "First News", "description": "This is a news item"}
newsitem(data)
news()

# from boto3.dynamodb.conditions import Attr
# import boto3

# dynamodb = boto3.resource("dynamodb")

# def list_news_items(start_date=None, end_date=None):
#     """
#     Retrieve all news items from the DynamoDB table, optionally filtering by date range.

#     Args:
#         start_date: Start date for filtering (inclusive).
#         end_date: End date for filtering (inclusive).

#     Returns:
#         List of news items matching the criteria.
#     """
#     table = dynamodb.Table("skyworkz-news")

#     # Scan the table
#     scan_params = {}
#     if start_date and end_date:
#         scan_params["FilterExpression"] = Attr("date").between(start_date, end_date)

#     response = table.scan(**scan_params)
#     return response.get("Items", [])

# print(list_news_items())

# import datetime
# start_date = (datetime.datetime.today()-datetime.timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
# end_date = datetime.datetime.today().strftime("%Y-%m-%dT%H:%M:%SZ")

# print(list_news_items(start_date, end_date))
