from api_utils import success


def handler(event, context):
    return success({"status": "OK"})
