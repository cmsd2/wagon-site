import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

interface CdnProps extends cdk.StackProps {
    zoneName: string;
    zoneId: string;
    siteDomain: string;
    siteBucket: s3.IBucket;
    oai: cloudfront.IOriginAccessIdentity;
}

export class CdnStack extends cdk.Stack {
  distribution: cloudfront.IDistribution;
  zone: route53.IHostedZone;
  cert: acm.ICertificate;
  aRecord: route53.ARecord;
  aaaaRecord: route53.AaaaRecord;
  domainName: string;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id, props);

    this.domainName = `${props.siteDomain}.${props.zoneName}`;

    this.zone = route53.HostedZone.fromHostedZoneAttributes(this, 'WagonSiteZone', {
        hostedZoneId: props.zoneId,
        zoneName: props.zoneName,
    });

    this.cert = new acm.Certificate(this, 'WagonSiteCertificate', {
        domainName: this.domainName,
        validation: acm.CertificateValidation.fromDns(this.zone),
        transparencyLoggingEnabled: false,
    });

    this.distribution = new cloudfront.Distribution(this, 'WagonSiteDistribution', {
        defaultBehavior: {
            origin: new S3Origin(props.siteBucket, {
                originAccessIdentity: props.oai,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        defaultRootObject: 'index.html',
        domainNames: [this.domainName],
        certificate: this.cert,
        geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'GB')
    });

    this.aRecord = new route53.ARecord(this, 'ARecord', {
        zone: this.zone,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        recordName: props.siteDomain,
    });

    this.aaaaRecord = new route53.AaaaRecord(this, 'AaaaRecord', {
        zone: this.zone,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
        recordName: props.siteDomain,
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
        value: `https://${this.domainName}`,
        description: 'URL for static site',
    });
  }
}
