import {
  Stack,
  custom_resources as cr,
  aws_s3 as s3,
  aws_ssm as ssm,
  aws_s3_deployment as s3Deployment,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfrontOrigins,
  RemovalPolicy,
  Duration,
} from "aws-cdk-lib";

import { Construct } from "constructs";

import { BaseStackProps } from "../../interfaces/stack-props";

export interface FrontendStackProps extends BaseStackProps {}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { project, ssmConfig } = props;

    const bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${project}-frontend`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
    });

    const apiGatewayId = ssm.StringParameter.valueForStringParameter(
      this,
      ssmConfig.apiGatewayId
    );

    // const uploadBucket = s3.Bucket.fromBucketName(
    //   this,
    //   "UploadBucket",
    //   ssm.StringParameter.valueForStringParameter(
    //     this,
    //     ssmConfig.uploadBucketName
    //   )
    // );

    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
      bucketName: `${project}-uploads`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
    });

    const distribution = new cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin: new cloudfrontOrigins.S3Origin(bucket),
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
              headerBehavior: cloudfront.CacheHeaderBehavior.none(),
              cookieBehavior: cloudfront.CacheCookieBehavior.none(),
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
            // allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
            // cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        defaultRootObject: "index.html",
      }
    );

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
    // new cr.AwsCustomResource(this, "GrantCloudFrontAccess", {
    //   onCreate: {
    //     service: "S3",
    //     action: "putBucketPolicy",
    //     parameters: {
    //       Bucket: uploadBucket.bucketName,
    //       Policy: JSON.stringify({
    //         Version: "2012-10-17",
    //         Statement: [
    //           {
    //             Effect: "Allow",
    //             Principal: {
    //               Service: "cloudfront.amazonaws.com",
    //             },
    //             Action: "s3:GetObject",
    //             Resource: `arn:aws:s3:::${uploadBucket.bucketName}/*`,
    //             Condition: {
    //               StringEquals: {
    //                 "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
    //               },
    //             },
    //           },
    //         ],
    //       }),
    //     },
    //     physicalResourceId: cr.PhysicalResourceId.of(
    //       `${uploadBucket.bucketName}-cloudfront-access`
    //     ),
    //   },
    //   onUpdate: {
    //     service: "S3",
    //     action: "putBucketPolicy",
    //     parameters: {
    //       Bucket: uploadBucket.bucketName,
    //       Policy: JSON.stringify({
    //         Version: "2012-10-17",
    //         Statement: [
    //           {
    //             Effect: "Allow",
    //             Principal: {
    //               Service: "cloudfront.amazonaws.com",
    //             },
    //             Action: "s3:GetObject",
    //             Resource: `arn:aws:s3:::${uploadBucket.bucketName}/*`,
    //             Condition: {
    //               StringEquals: {
    //                 "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
    //               },
    //             },
    //           },
    //         ],
    //       }),
    //     },
    //     physicalResourceId: cr.PhysicalResourceId.of(
    //       `${uploadBucket.bucketName}-cloudfront-access`
    //     ),
    //   },
    //   policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
    //     resources: [`arn:aws:s3:::${uploadBucket.bucketName}`],
    //   }),
    // });

    new s3Deployment.BucketDeployment(this, "DeployFrontend", {
      sources: [s3Deployment.Source.asset("./frontend/out")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
