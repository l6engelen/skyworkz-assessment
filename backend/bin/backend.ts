#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../stacks/api/stack";

const app = new cdk.App();

const props = {
  env: { account: "970547364388", region: "eu-west-1" } as cdk.Environment,
  project: "skyworkz",
  stage: "dev",
};

new ApiStack(app, `${props.project}-${props.stage}-api`, props);
