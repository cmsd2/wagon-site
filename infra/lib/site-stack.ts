import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

interface SiteProps extends cdk.StackProps {
}

export class SiteStack extends cdk.Stack {
  siteBucket: s3.IBucket;
  oai: cloudfront.IOriginAccessIdentity;

  constructor(scope: Construct, id: string, props?: SiteProps) {
    super(scope, id, props);

    this.siteBucket = new s3.Bucket(this, 'WagonSiteBucket', {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      lifecycleRules: [{
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        enabled: true,
        id: 'DeleteFailedMultipartUploads',
      }]
    });

    this.oai = new cloudfront.OriginAccessIdentity(this, 'WagonSiteOAI', {
      comment: `OAI for Cloudfront`,
    });

    this.siteBucket.grantRead(this.oai);

    new cdk.CfnOutput(this, 'SiteBucket', {
      value: this.siteBucket.bucketName,
      description: 'Bucket for static site content'
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
      value: this.siteBucket.bucketWebsiteUrl,
      description: 'URL for static site'
    });
  }
}
