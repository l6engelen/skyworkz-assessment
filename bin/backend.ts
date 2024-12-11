#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config();

import * as cdk from "aws-cdk-lib";
import { BaseStackProps } from "../backend/interfaces/stack-props";
import { EnvironmentConfig } from "../backend/interfaces/cdk-config";

import { ApiStack } from "../backend/stacks/api/stack";
import { DatabaseStack } from "../backend/stacks/database/stack";
import { FrontendStack } from "../backend/stacks/frontend/stack";

const app = new cdk.App();
const envconfig = app.node.tryGetContext("environment") as EnvironmentConfig;

const props = {
  env: { account: envconfig.awsAccount, region: envconfig.awsRegion },
  project: envconfig.project,
  ssmConfig: {
    newsTableName: `/${envconfig.project}/dynamodb/table-name`,
    apiGatewayId: `/${envconfig.project}/api-gateway/id`,
    uploadBucketName: `/${envconfig.project}/s3/upload-bucket-name`,
  },
} as BaseStackProps;

const databaseStack = new DatabaseStack(
  app,
  `${props.project}-database`,
  props
);
const apiStack = new ApiStack(app, `${props.project}-api`, props);
apiStack.addDependency(databaseStack);

const frontendStack = new FrontendStack(
  app,
  `${props.project}-frontend`,
  props
);
frontendStack.addDependency(apiStack);
