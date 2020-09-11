import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as route53targets from "@aws-cdk/aws-route53-targets";
import * as ssm from "@aws-cdk/aws-ssm";
import * as acm from "@aws-cdk/aws-certificatemanager";
import { Duration } from "@aws-cdk/core";
import { domain } from "process";

export interface WagonSiteProps extends cdk.StackProps {
  envName: string;
  zone: route53.IHostedZone;
  domainName: string;
  cert: acm.ICertificate;
}

export class WagonSiteStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly oai: cloudfront.IOriginAccessIdentity;
  public readonly distribution: cloudfront.IDistribution;

  constructor(scope: cdk.Construct, id: string, props: WagonSiteProps) {
    super(scope, id, props);

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

    this.oai = new cloudfront.OriginAccessIdentity(this, "oai", {
      comment: "wagon-site-bucket-oai",
    });

    this.bucket.grantRead(this.oai.grantPrincipal);

    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "distribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.bucket,
              originAccessIdentity: this.oai,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        enableIpV6: true,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          props.cert,
          { aliases: [props.domainName + "." + props.zone.zoneName] }
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    );

    new cdk.CfnOutput(this, "wagon-site-distribution-domain-name", {
      value: this.distribution.distributionDomainName,
      exportName: "wagon-site-distribution-domain-name-" + props.envName,
      description:
        "wagon-site " + props.envName + " cloudfront distribution domain name",
    });

    new cdk.CfnOutput(this, "wagon-site-distribution-id", {
      value: this.distribution.distributionId,
      exportName: "wagon-site-distribution-id-" + props.envName,
      description:
        "wagon-site " + props.envName + " cloudfront distribution id",
    });

    new route53.ARecord(this, "wagon-site-a-record", {
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(this.distribution)
      ),
      zone: props.zone,
      recordName: props.domainName,
      ttl: cdk.Duration.minutes(5),
    });

    new route53.AaaaRecord(this, "wagon-site-aaaa-record", {
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(this.distribution)
      ),
      zone: props.zone,
      recordName: props.domainName,
      ttl: cdk.Duration.minutes(5),
    });
  }
}
