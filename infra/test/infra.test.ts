import {
  expect as expectCDK,
  matchTemplate,
  haveResource,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as WagonSite from "../lib/wagon-site-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new WagonSite.WagonSiteStack(app, "MyTestStack", {
    envName: "test",
  });
  // THEN
  expectCDK(stack).to(haveResource("AWS::S3::Bucket", {}));
});
