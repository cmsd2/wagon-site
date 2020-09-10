import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import { Duration } from "@aws-cdk/core";

export class InfraStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    this.bucket = new s3.Bucket(this, "site-bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
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
