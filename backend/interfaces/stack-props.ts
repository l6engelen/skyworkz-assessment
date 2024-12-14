import { StackProps, Environment } from "aws-cdk-lib";

export interface BaseStackProps extends StackProps {
  env: Environment;
  project: string;
  stage: string;
  ssmConfig: SsmConfig;
  sharedConfig: SharedConfig;
}

interface SsmConfig {
  apiGatewayId: string;
  cloudFrontDistributionId: string;
  apiKeyId: string;
}

interface SharedConfig {
  frontendBucketName: string;
  uploadBucketName: string;
  newsTableName: string;
}
