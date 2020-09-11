import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as ssm from "@aws-cdk/aws-ssm";
import * as acm from "@aws-cdk/aws-certificatemanager";

export interface WagonCertProps extends cdk.StackProps {
  domainName: string;
  zone: route53.IHostedZone;
  region: string;
  certArnParam: string;
}

export class WagonCertStack extends cdk.Stack {
  public readonly cert: acm.ICertificate;

  constructor(scope: cdk.Construct, id: string, props: WagonCertProps) {
    super(scope, id, props);

    this.cert = new acm.DnsValidatedCertificate(this, "wagon-cert", {
      domainName: props.domainName,
      hostedZone: props.zone,
      region: props.region,
      validation: acm.CertificateValidation.fromDns(props.zone),
      validationMethod: acm.ValidationMethod.DNS,
      subjectAlternativeNames: ["*." + props.domainName],
    });

    new ssm.StringParameter(this, "wagon-cert-arn", {
      stringValue: this.cert.certificateArn,
      parameterName: props.certArnParam,
    });
  }
}
