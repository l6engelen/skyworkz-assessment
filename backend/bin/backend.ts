#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config();

import * as cdk from "aws-cdk-lib";
import { BaseStackProps } from "../lib/interfaces/stack-props";
import { EnvironmentConfig } from "../lib/interfaces/cdk-config";

import { ApiStack } from "../stacks/api/stack";
import { DatabaseStack } from "../stacks/database/stack";

const app = new cdk.App();
const envconfig = app.node.tryGetContext("environment") as EnvironmentConfig;
const stage = process.env.STAGE;

const props = {
  env: { account: envconfig.awsAccount, region: envconfig.awsRegion },
  project: envconfig.project,
  stage: stage,
  ssmConfig: {
    newsTableName: `/${envconfig.project}/${stage}/dynamodb/table-name`,
  },
} as BaseStackProps;

new ApiStack(app, `${props.project}-${props.stage}-api`, props);

new DatabaseStack(app, `${props.project}-${props.stage}-database`, props);
