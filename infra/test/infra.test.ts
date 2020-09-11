import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as WagonSite from "../lib/wagon-site-stack";
import { WagonDomainStack } from "../lib/wagon-domain-stack";
import { WagonCertStack } from "../lib/wagon-cert-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const domain = new WagonDomainStack(app, "MyTestDomainStack", {
    name: "wagon-test",
    zoneIdParam: "omcloud-cloud-domain-zoneId",
    zoneNameParam: "omcloud-cloud-domain-zoneName",
  });
  const cert = new WagonCertStack(app, "MyTestCertStack", {
    certArnParam: "wagon-test-cert-arn",
    domainName: "wagon-test.octomonkey.cloud",
    region: "us-east-1",
    zone: domain.zone,
  });
  const stack = new WagonSite.WagonSiteStack(app, "MyTestStack", {
    envName: "test",
    cert: cert.cert,
    domainName: "wagon-test",
    zone: domain.zone,
  });
  // THEN
  expectCDK(stack).to(haveResource("AWS::S3::Bucket", {}));
});
