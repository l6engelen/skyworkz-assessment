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

// Users Projects
export const UsersProjectsResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      user: typeString,
      projects_info: {
        type: object,
        properties: {
          key: typeString,
          items: typeArray,
        },
      },
    },
  },
  {
    statusCode: "400",
    properties: {
      ...propertyMissingParameter,
    },
  },
  {
    statusCode: "500",
    properties: {
      ...propertyMessage,
    },
  },
];

// Users Token
export const TokenResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      role: typeString,
      id_token: typeString,
      access_token: typeString,
      refresh_token: typeString,
    },
  },
  {
    statusCode: "400",
    properties: {
      ...propertyMissingParameter,
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
      role: typeString,
      refresh_token: typeString,
      ...propertyMessage,
    },
  },
];

// Projects Stages
export const ProjectStagesResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      stages: {
        type: array,
        items: typeString,
      },
    },
  },
  {
    statusCode: "400",
    properties: {
      ...propertyMissingParameter,
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

// Projects List
export const ProjectListResponses: ApiResponseModel[] = [
  {
    statusCode: "200",
    properties: {
      projects: {
        type: array,
        items: typeString,
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
