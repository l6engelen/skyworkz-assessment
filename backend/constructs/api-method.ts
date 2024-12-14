import * as cdk from "aws-cdk-lib";
import {
  aws_lambda as lambda,
  aws_iam as iam,
  aws_logs as logs,
  aws_apigateway as apigateway,
} from "aws-cdk-lib";
import { ContentHandling } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { ApiResponseModel } from "../stacks/api/response-models"; // TODO move?

type APIMethodConstructProps = {
  projectName: string; // The project name
  methodName: string; // The method name
  methodType: string; // The method type (GET/POST)
  methodAuthorizationType: apigateway.AuthorizationType; // Authorization type of the method
  api: apigateway.RestApi; // API to add the method to
  resource: apigateway.Resource; // Resource to add the method to
  responseModels: ApiResponseModel[]; // Array of response models for the method
  requestParameters?: {}; // Request parameters for the method
  lambdaCodePath?: string; //	The local path to your Lambda function source code.
  functionName?: string; // The lambda function name
  handler?: string; //	The name of the method within your code that Lambda calls to execute your function.
  lambdaEnvironment?: { [key: string]: string }; // Key-value pairs that Lambda caches and makes available for your Lambda functions.
  layers?: lambda.ILayerVersion[]; //	A list of layers to add to the function's execution environment.
  memorySize?: number; //	The amount of memory, in MB, that is allocated to your Lambda function.
  managedPolicies?: string[]; // List of extra managed policies, to be added to the role
  policyStatements?: iam.PolicyStatement[]; // List of extra policies, to be added to the role
  timeout?: cdk.Duration; //	The function execution time (in seconds) after which Lambda terminates the function.
  existingLambdaArn?: string; // Lambda arn of an existing lambda to use as method backend
  authorizer?: apigateway.IAuthorizer; // Authorizer to use for the method
  apiKeyRequired?: boolean; // Specifies whether the method requires an API key
};

export class APIMethodConstruct extends Construct {
  public readonly method: apigateway.Method;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: APIMethodConstructProps) {
    super(scope, id);

    let {
      projectName,
      methodName,
      methodType,
      lambdaCodePath = "",
      api,
      resource,
      responseModels,
      requestParameters,
      methodAuthorizationType,
      existingLambdaArn,
      authorizer,
      functionName = `${projectName}-api-${methodName}`,
      handler = "lambda_function.handler",
      lambdaEnvironment = undefined,
      layers = undefined,
      memorySize = 128,
      managedPolicies = [],
      policyStatements = [],
      timeout = cdk.Duration.minutes(2),
      apiKeyRequired = false,
    } = props;

    if (existingLambdaArn) {
      this.lambdaFunction = lambda.Function.fromFunctionArn(
        this,
        `${id}Lambda`,
        existingLambdaArn
      ) as lambda.Function;
    } else {
      const baseRole: iam.Role = new iam.Role(this, `${id}LambdaRole`, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      });
      baseRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      );

      for (const managedPolicy of managedPolicies) {
        baseRole.addManagedPolicy(
          iam.ManagedPolicy.fromAwsManagedPolicyName(managedPolicy)
        );
      }
      for (const policy of policyStatements) {
        baseRole.addToPolicy(policy);
      }

      this.lambdaFunction = new lambda.Function(this, `${id}Lambda`, {
        code: lambda.Code.fromAsset(lambdaCodePath),
        functionName: functionName,
        handler: handler,
        runtime: lambda.Runtime.PYTHON_3_9,
        architecture: lambda.Architecture.X86_64,
        environment: lambdaEnvironment,
        ephemeralStorageSize: cdk.Size.mebibytes(512),
        layers: layers,
        logRetention: logs.RetentionDays.ONE_WEEK,
        memorySize: memorySize,
        retryAttempts: 0,
        timeout: timeout,
        role: baseRole,
      });
    }

    const methodResponses: apigateway.MethodResponse[] = [];

    responseModels.forEach((responseModel) => {
      const modelName = `${id}${responseModel.statusCode}`;
      const contentType = responseModel.contentType || "application/json";

      // Add responseModel to api
      const model: cdk.aws_apigateway.Model = api.addModel(
        `${modelName}ResponseModel`,
        {
          modelName: modelName,
          contentType: contentType,
          schema: {
            schema: apigateway.JsonSchemaVersion.DRAFT4,
            title: modelName,
            type: apigateway.JsonSchemaType.OBJECT,
            properties: responseModel.properties,
          },
        }
      );

      // Create a methodResponse for each responseModel
      const methodResponse: cdk.aws_apigateway.MethodResponse = {
        statusCode: responseModel.statusCode,
        responseModels: {
          [contentType]: model,
        },
      };
      methodResponses.push(methodResponse);
    });

    // Add method to api resource
    this.method = resource.addMethod(
      methodType,
      new apigateway.LambdaIntegration(this.lambdaFunction, {
        contentHandling: ContentHandling.CONVERT_TO_TEXT,
      }),
      {
        authorizer: authorizer,
        authorizationType: methodAuthorizationType,
        requestParameters: requestParameters,
        methodResponses: methodResponses,
        apiKeyRequired: apiKeyRequired,
      }
    );
  }
}
