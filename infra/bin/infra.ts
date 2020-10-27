#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { WagonSiteStack } from "../lib/wagon-site-stack";
import { WagonDomainStack } from "../lib/wagon-domain-stack";
import { WagonCertStack } from "../lib/wagon-cert-stack";
import { Fn } from "@aws-cdk/core";

const app = new cdk.App();

const domain = new WagonDomainStack(app, "wagon-domain", {
  name: "wagon",
  zoneIdParam: "omcloud-cloud-domain-zoneId",
  zoneNameParam: "omcloud-cloud-domain-zoneName",
});
const cert = new WagonCertStack(app, "wagon-cert", {
  certArnParam: "wagon-cert-arn",
  domainName: "wagon.octomonkey.cloud",
  region: "us-east-1",
  zone: domain.zone,
});
const site = new WagonSiteStack(app, "wagon-site", {
  envName: "prod",
  zone: domain.zone,
  domainName: undefined,
  cert: cert.cert,
  apiDomainName: Fn.importValue("WagonApiDomainName"),
  apiPath: Fn.importValue("WagonApiPath")
});
