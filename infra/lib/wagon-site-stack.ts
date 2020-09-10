import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import { Duration } from "@aws-cdk/core";

export interface WagonSiteProps extends cdk.StackProps {
  envName: string;
}

export class WagonSiteStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props: WagonSiteProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const bucketName = cdk.Fn.join("-", [
      "octomonkey",
      this.region,
      this.account,
      "wagon-site",
      props.envName,
    ]);

    this.bucket = new s3.Bucket(this, "wagon-site-bucket", {
      bucketName: bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    });

    new cdk.CfnOutput(this, "wagon-site-bucket-arn-output", {
      value: this.bucket.bucketArn,
      description: "wagon-site " + props.envName + " bucket arn",
      exportName: "wagon-site-bucket-arn-" + props.envName,
    });

    new cdk.CfnOutput(this, "wagon-site-bucket-output", {
      value: this.bucket.bucketName,
      description: "wagon-site " + props.envName + " bucket name",
      exportName: "wagon-site-bucket-" + props.envName,
    });

    this.bucket.addLifecycleRule({
      abortIncompleteMultipartUploadAfter: Duration.days(1),
      enabled: true,
      id: "orphaned-objects",
      noncurrentVersionExpiration: Duration.days(14),
    });

    new s3deploy.BucketDeployment(this, "site-deploy", {
      sources: [s3deploy.Source.asset("../build")],
      destinationBucket: this.bucket,
      serverSideEncryption: s3deploy.ServerSideEncryption.AES_256,
    });
  }
}
