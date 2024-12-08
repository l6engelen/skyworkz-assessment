
import json
from urllib.parse import urlencode, urljoin
import requests

stage = "dev"
api_id = "z8fnuqzba1"
base_url = f"https://{api_id}.execute-api.eu-west-1.amazonaws.com"

endpoint = "ping"
endpoint_url = f"{base_url}/{stage}/{endpoint}"


response = requests.get(endpoint_url)

if response.status_code == 200:
    print("API call successful. Response:")
    print(response.json())
else:
    print(f"Failed to invoke API. Status code: {response.status_code}")
    print(response.text)
