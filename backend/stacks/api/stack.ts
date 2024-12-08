import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_logs as logs,
  aws_cognito as cognito,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { PythonLayerVersion } from "@aws-cdk/aws-lambda-python-alpha";

import { APIMethodConstruct } from "../../lib/constructs/api-method";
import * as Responses from "./response-models";

export interface ApiProps extends StackProps {
  project: string;
  stage: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { project, stage } = props;

    // Logs
    const logGroup = new logs.LogGroup(this, "Logs", {
      logGroupName: `/aws/api/${project}/${stage}`,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Api
    const api: apigateway.RestApi = new apigateway.RestApi(this, "RestApi", {
      restApiName: project,
      description: `API for project ${project}`,
      deploy: false,
      cloudWatchRole: true,
    });

    // new ssm.StringParameter(this, "ApiGatewayIdParameter", {
    //   parameterName: ssmConfig.apiGatewayId,
    //   stringValue: api.restApiId,
    // });

    const deployment: apigateway.Deployment = new apigateway.Deployment(
      this,
      "Deployment",
      {
        api: api,
      }
    );
    api.deploymentStage = new apigateway.Stage(this, "Stage", {
      stageName: stage,
      deployment: deployment,
      cachingEnabled: false, // tmp
      accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
      accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
        caller: false,
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

    // const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
    //   this,
    //   "CognitoAuthorizer",
    //   {
    //     cognitoUserPools: [userPool],
    //   }
    // );

    // Resources
    const pingResource: apigateway.Resource = api.root.addResource("ping");

    // Lambda Api utils layer
    const lambdaApiUtils: PythonLayerVersion = new PythonLayerVersion(
      this,
      "LambdaApiUtilsLayer",
      {
        entry: "./lib/layers/api/",
        compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
        layerVersionName: `${project}-api-utils`,
      }
    );

    // Ping
    new APIMethodConstruct(this, "Ping", {
      api: api,
      projectName: project,
      methodName: "ping",
      methodType: "GET",
      resource: pingResource,
      lambdaCodePath: "lib/lambdas/api/ping",
      layers: [lambdaApiUtils],
      responseModels: Responses.PingResponses,
      methodAuthorizationType: apigateway.AuthorizationType.NONE,
      // authorizer: cognitoAuthorizer,
    });
  }
}
