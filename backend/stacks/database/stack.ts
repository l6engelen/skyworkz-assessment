import { Stack, aws_dynamodb as dynamodb, RemovalPolicy } from "aws-cdk-lib";

import { Construct } from "constructs";
import { BaseStackProps } from "../../interfaces/stack-props";

export interface DatabaseStackProps extends BaseStackProps {}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { sharedConfig } = props;

    const newsTable = new dynamodb.Table(this, "NewsTable", {
      tableName: sharedConfig.newsTableName,
      partitionKey: {
        name: "partitionKey",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "date", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
