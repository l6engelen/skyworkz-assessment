import { aws_apigateway as apigateway } from "aws-cdk-lib";

export type ApiResponseModel = {
  statusCode: string; // Status code of the response
  properties: { [key: string]: apigateway.JsonSchema }; // Schema of the response
  contentType?: string; // Default application/json
};

// Json Schema Types Strings
const string: apigateway.JsonSchemaType.STRING =
  apigateway.JsonSchemaType.STRING;
const integer: apigateway.JsonSchemaType.INTEGER =
  apigateway.JsonSchemaType.INTEGER;
const array: apigateway.JsonSchemaType.ARRAY = apigateway.JsonSchemaType.ARRAY;
const object: apigateway.JsonSchemaType.OBJECT =
  apigateway.JsonSchemaType.OBJECT;

// Json Schema Types Objects
const typeString: {} = {
  type: string,
};
const typeInteger: {} = {
  type: integer,
};
const typeArray: {} = {
  type: array,
};

// Reused Properties
const propertyMessage: {} = {
  message: typeString,
};
const propertyMissingParameter: {} = {
  missing_parameter: typeString,
};

// Ping
export const PingResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      status: typeString,
    },
  },
];

// News
export const NewsResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      news_items: typeArray,
    },
  },
  {
    statusCode: "500",
    properties: {
      ...propertyMessage,
    },
  },
];

// Newsitems
export const NewsitemsResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      news_item: {
        type: object,
        properties: {
          key: {
            type: object,
            properties: {
              id: typeString,
              description: typeString,
              date: typeString,
              title: typeString,
            },
          },
        },
      },
    },
  },
  {
    statusCode: "403",
    properties: {
      ...propertyMessage,
    },
  },
  {
    statusCode: "500",
    properties: {
      ...propertyMessage,
    },
  },
];
