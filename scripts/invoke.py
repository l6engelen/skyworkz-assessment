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


def request_get(url, headers):
    response = requests.get(url, headers=headers)
    return process_response(response)


def request_post(url, data, headers):
    response = requests.post(url, data=json.dumps(data), headers=headers)
    return process_response(response)


stage = "api"
api_id = "mvprx0of0m"
api_key = ""
base_url = f"https://{api_id}.execute-api.eu-west-1.amazonaws.com"

headers = {"x-api-key": api_key}


def ping():
    endpoint = "ping"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_get(endpoint_url, headers=headers)


def news():
    endpoint = "news"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_get(endpoint_url, headers=headers)


def newsitem(item):
    endpoint = "newsitem"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    request_post(endpoint_url, item, headers=headers)


def pre_signed_url():
    endpoint = "pre-signed-url"
    endpoint_url = f"{base_url}/{stage}/{endpoint}"
    query_params = {"filename": "test.jpg"}
    full_endpoint_url = f"{endpoint_url}?{urlencode(query_params)}"
    request_get(full_endpoint_url, haders=headers)


ping()
news()

# data = {"title": "First News", "description": "This is a news item"}
# newsitem(data)
# news()
