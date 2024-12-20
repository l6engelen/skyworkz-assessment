import {
  Stack,
  RemovalPolicy,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_logs as logs,
  aws_cognito as cognito,
  aws_secretsmanager as secretsmanager,
  SecretValue,
} from "aws-cdk-lib";
import { PythonLayerVersion } from "@aws-cdk/aws-lambda-python-alpha";

import { Construct } from "constructs";

import { APIMethodConstruct } from "../../constructs/api-method";
import { BaseStackProps } from "../../interfaces/stack-props";

import * as Responses from "./response-models";

export interface ApiProps extends BaseStackProps {}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { project, ssmConfig, sharedConfig } = props;

    // Logs
    const logGroup = new logs.LogGroup(this, "Logs", {
      logGroupName: `/aws/api/${project}/`,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Api
    const api: apigateway.RestApi = new apigateway.RestApi(this, "RestApi", {
      restApiName: project,
      description: `API for project ${project}`,
      deploy: false,
      cloudWatchRole: true,
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    new ssm.StringParameter(this, "ApiGatewayIdParameter", {
      parameterName: ssmConfig.apiGatewayId,
      stringValue: api.restApiId,
    });

    const deployment: apigateway.Deployment = new apigateway.Deployment(
      this,
      `Deployment${Date.now()}`,
      {
        api: api,
      }
    );
    const stage = new apigateway.Stage(this, "Stage", {
      stageName: "api",
      deployment: deployment,
      cachingEnabled: false, // tmp
      accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
      accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
        caller: true,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      metricsEnabled: true,
    });
    api.deploymentStage = stage;

    const apiKey = api.addApiKey("ApiKey", {
      apiKeyName: "CloudFrontApiKey",
    });
    const usagePlan = api.addUsagePlan("UsagePlan", {
      apiStages: [
        {
          api: api,
          stage: stage,
        },
      ],
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      quota: {
        limit: 20,
        period: apigateway.Period.DAY,
      },
    });
    usagePlan.addApiKey(apiKey);

    // Resources
    const pingResource: apigateway.Resource = api.root.addResource("ping");
    const newsResource: apigateway.Resource = api.root.addResource("news");
    const newsitemResource: apigateway.Resource =
      api.root.addResource("newsitem");
    const preSignedUrlResource: apigateway.Resource =
      api.root.addResource("pre-signed-url");

    // Lambda Api utils layer
    const lambdaApiUtils: PythonLayerVersion = new PythonLayerVersion(
      this,
      "LambdaApiUtilsLayer",
      {
        entry: "./backend/layers/api/",
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        layerVersionName: `${project}-api-utils`,
      }
    );

    // GET /ping
    new APIMethodConstruct(this, "Ping", {
      api: api,
      projectName: project,
      methodName: "ping",
      methodType: "GET",
      resource: pingResource,
      lambdaCodePath: "backend/lambdas/api/ping",
      layers: [lambdaApiUtils],
      responseModels: Responses.PingResponses,
      methodAuthorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: true,
    });

    // GET /news
    new APIMethodConstruct(this, "News", {
      api: api,
      projectName: project,
      methodName: "news",
      methodType: "GET",
      resource: newsResource,
      lambdaCodePath: "backend/lambdas/api/news",
      layers: [lambdaApiUtils],
      responseModels: Responses.NewsResponses,
      requestParameters: {
        "method.request.querystring.limit": false,
        "method.request.querystring.nex_key": false,
      },
      methodAuthorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: true,
      lambdaEnvironment: {
        NEWS_TABLE_NAME: sharedConfig.newsTableName,
      },
      policyStatements: [
        new iam.PolicyStatement({
          actions: ["dynamodb:Query"],
          resources: [
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${sharedConfig.newsTableName}`,
          ],
        }),
      ],
    });

    // POST /newsitem
    new APIMethodConstruct(this, "NewsItem", {
      api: api,
      projectName: project,
      methodName: "newsitem",
      methodType: "POST",
      resource: newsitemResource,
      lambdaCodePath: "backend/lambdas/api/newsitem",
      layers: [lambdaApiUtils],
      responseModels: Responses.NewsitemsResponses,
      methodAuthorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: true,
      lambdaEnvironment: {
        NEWS_TABLE_NAME: sharedConfig.newsTableName,
      },
      policyStatements: [
        new iam.PolicyStatement({
          actions: ["dynamodb:PutItem"],
          resources: [
            `arn:aws:dynamodb:${this.region}:${this.account}:table/${sharedConfig.newsTableName}`,
          ],
        }),
      ],
    });

    // GET /pre-signed-url
    new APIMethodConstruct(this, "PreSignedUrl", {
      api: api,
      projectName: project,
      methodName: "pre-signed-url",
      methodType: "GET",
      resource: preSignedUrlResource,
      lambdaCodePath: "backend/lambdas/api/pre-signed-url",
      layers: [lambdaApiUtils],
      responseModels: Responses.PreSignedUrlResponses,
      requestParameters: {
        "method.request.querystring.filename": true,
      },
      methodAuthorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: true,
      lambdaEnvironment: {
        BUCKET_NAME: sharedConfig.uploadBucketName,
        UPLOADS_FOLDER: "thumbnails",
      },
      policyStatements: [
        new iam.PolicyStatement({
          actions: ["s3:PutObject"],
          resources: [`arn:aws:s3:::${sharedConfig.uploadBucketName}/*`],
        }),
      ],
    });
  }
}
