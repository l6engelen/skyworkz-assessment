import {
  Stack,
  aws_dynamodb as dynamodb,
  aws_ssm as ssm,
  RemovalPolicy,
} from "aws-cdk-lib";

import { Construct } from "constructs";
import { BaseStackProps } from "../../lib/interfaces/stack-props";

export interface DatabaseStackProps extends BaseStackProps {}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { project, stage, ssmConfig } = props;

    const newsTable = new dynamodb.Table(this, "NewsTable", {
      tableName: `${project}-${stage}-news`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    newsTable.addGlobalSecondaryIndex({
      indexName: "DateIndex",
      partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
    });

    new ssm.StringParameter(this, "NewsTableNameParameter", {
      parameterName: ssmConfig.newsTableName,
      stringValue: newsTable.tableName,
    });
  }
}
