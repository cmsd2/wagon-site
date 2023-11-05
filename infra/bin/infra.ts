#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SiteStack } from '../lib/site-stack';
import { CdnStack } from '../lib/cdn-stack';
import { DeploymentStack } from '../lib/deplopyment-stack';

const app = new cdk.App();
const siteStack = new SiteStack(app, 'WagonSite', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  env: {
    region: 'us-east-1',
  }
});

const cdnStack = new CdnStack(app, 'WagonCdn', {
  siteBucket: siteStack.siteBucket,
  siteDomain: 'www',
  zoneName: 'octomonkey.cloud',
  zoneId: 'Z01082942PS49FCF86EV4',
  oai: siteStack.oai,
  env: {
    region: 'us-east-1',
  }
});

new DeploymentStack(app, 'WagonDeployment', {
  siteBucket: siteStack.siteBucket,
  distribution: cdnStack.distribution,
  env: {
    region: 'us-east-1',
  }
});
