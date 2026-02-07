import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class ApplyBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const smEnv = process.env.SM_ENV ?? "dev03";

    this.bucket = new s3.Bucket(this, "ApplyBucket", {
      bucketName: `sm-${smEnv}-app-apply-bucket`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
  }
}
