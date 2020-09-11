import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as ssm from "@aws-cdk/aws-ssm";

export interface WagonDomainProps extends cdk.StackProps {
  domainName: string;
  zoneIdParam: string;
  zoneNameParam: string;
}

export class WagonDomainStack extends cdk.Stack {
  public readonly zone: route53.IHostedZone;

  constructor(scope: cdk.Construct, id: string, props: WagonDomainProps) {
    super(scope, id, props);

    this.zone = new route53.PublicHostedZone(this, "wagon-zone", {
      zoneName: props.domainName,
    });

    const zoneId = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "wagon-parent-zone-id",
      {
        parameterName: props.zoneIdParam,
      }
    ).stringValue;

    const zoneName = ssm.StringParameter.fromStringParameterAttributes(
      this,
      "wagon-parent-zone-name",
      {
        parameterName: props.zoneNameParam,
      }
    ).stringValue;

    const parentZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "wagon-parent-zone",
      {
        hostedZoneId: zoneId,
        zoneName: zoneName,
      }
    );

    new route53.ZoneDelegationRecord(this, "wagon-domain-delegation", {
      zone: parentZone,
      nameServers: this.zone.hostedZoneNameServers!,
      recordName: props.domainName,
    });
  }
}
