#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { WagonSiteStack } from "../lib/wagon-site-stack";

const app = new cdk.App();
new WagonSiteStack(app, "wagon-site", {
  envName: "prod",
});
