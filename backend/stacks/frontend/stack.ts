import {
  Stack,
  custom_resources as cr,
  aws_iam as iam,
  aws_s3 as s3,
  aws_ssm as ssm,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfrontOrigins,
  aws_lambda as lambda,
  RemovalPolicy,
  Duration,
  SecretValue,
} from "aws-cdk-lib";

import { Construct } from "constructs";

import { BaseStackProps } from "../../interfaces/stack-props";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface FrontendStackProps extends BaseStackProps {}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { ssmConfig, sharedConfig } = props;

    const frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: sharedConfig.frontendBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
    });

    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
      bucketName: sharedConfig.uploadBucketName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
    });

    const apiGatewayId = ssm.StringParameter.valueForStringParameter(
      this,
      ssmConfig.apiGatewayId
    );

    const distribution = new cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin: new cloudfrontOrigins.S3Origin(frontendBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          "api/*": {
            origin: new cloudfrontOrigins.HttpOrigin(
              `${apiGatewayId}.execute-api.${this.region}.amazonaws.com`
            ),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: new cloudfront.CachePolicy(this, "DevCachePolicy", {
              queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
              enableAcceptEncodingGzip: true,
              enableAcceptEncodingBrotli: true,
              defaultTtl: Duration.minutes(5),
              minTtl: Duration.minutes(1),
              maxTtl: Duration.minutes(10),
            }),
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          },
          "thumbnails/*": {
            origin: new cloudfrontOrigins.S3Origin(uploadBucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        defaultRootObject: "index.html",
      }
    );

    new ssm.StringParameter(this, "CloudfrontDistributionParameter", {
      parameterName: ssmConfig.cloudFrontDistributionId,
      stringValue: distribution.distributionId,
    });

    const corsPolicy = {
      CORSRules: [
        {
          AllowedMethods: ["POST", "GET", "PUT"],
          AllowedOrigins: [`https://${distribution.distributionDomainName}`],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    };
    new cr.AwsCustomResource(this, "SetBucketCors", {
      onCreate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: uploadBucket.bucketName,
          CORSConfiguration: corsPolicy,
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `${uploadBucket.bucketName}-cors`
        ),
      },
      onUpdate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: uploadBucket.bucketName,
          CORSConfiguration: corsPolicy,
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `${uploadBucket.bucketName}-cors`
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          `arn:aws:s3:::${uploadBucket.bucketName}`,
          `arn:aws:s3:::${uploadBucket.bucketName}/*`,
        ],
      }),
    });
  }
}
