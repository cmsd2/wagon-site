import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

interface DeploymentProps extends cdk.StackProps {
    siteBucket: s3.IBucket;
    distribution: cloudfront.IDistribution;
}

export class DeploymentStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: DeploymentProps) {
    super(scope, id, props);

    const siteSource = Source.asset("..", {
      bundling: {
        image: cdk.DockerImage.fromRegistry('node:20'),
        command: [
          'bash', '-c', [
            'npm install --cache /tmp/.npm',
            'npm run build',
            'cp -r build/* /asset-output'
          ].join(' && ')
        ],
        environment: {
          'NODE_ENV': 'production',
          'npm_config_cache': '/tmp/.npm'
        }
      }
    });

    new BucketDeployment(this, 'SiteDeployment', {
      sources: [siteSource],
      destinationBucket: props.siteBucket,
      distribution: props.distribution,
      distributionPaths: ['/*'],
    });
  }
}
