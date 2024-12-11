import { StackProps, Environment } from "aws-cdk-lib";

export interface BaseStackProps extends StackProps {
  env: Environment;
  project: string;
  stage: string;
  ssmConfig: SsmConfig;
}

interface SsmConfig {
  newsTableName: string;
  apiGatewayId: string;
  uploadBucketName: string;
}
