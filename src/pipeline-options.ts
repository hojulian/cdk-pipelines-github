import { v4 as uuidv4 } from 'uuid';
import { AwsCredentials, AwsCredentialsProvider } from './aws-credentials';
import * as github from './workflows-model';

/**
 * Assembly artifact options applied to all jobs using artifacts in the workflow.
 */
export abstract class AssemblyArtifactOptions {
  /**
   * Configure download assembly steps.
   *
   * @default - By default, it uses `actions/download-artifact@v3`.
   */
  abstract downloadAssemblySteps(targetName: string, targetDir: string): github.JobStep[];

  /**
   * Configure upload assembly steps.
   *
   * @default - By default, it uses `actions/upload-artifact@v3`.
   */
  abstract uploadAssemblySteps(sourceName: string, sourceDir: string): github.JobStep[];
}

/**
 * Github assembly artifact options uses built-in `upload-artifact/download-artifact`
 * for artifacts handling.
 */
export class GithubAssemblyArtifactOptions extends AssemblyArtifactOptions {

  constructor() {
    super();
  }

  downloadAssemblySteps(targetName: string, targetDir: string): github.JobStep[] {
    return [{
      name: `Download ${targetName}`,
      uses: 'actions/download-artifact@v3',
      with: {
        name: targetName,
        path: targetDir,
      },
    }];
  };

  uploadAssemblySteps(sourceName: string, sourceDir: string): github.JobStep[] {
    return [{
      name: `Upload ${sourceName}`,
      uses: 'actions/upload-artifact@v3',
      with: {
        name: sourceName,
        path: sourceDir,
      },
    }];
  };
}

/**
 * Props for `S3AssemblyArtifactOptions`.
 */
export interface S3AssemblyArtifactOptionsProps {
  readonly bucket: string;

  readonly region: string;

  readonly seed?: string;

  readonly awsCreds?: AwsCredentialsProvider;

  readonly assumeRoleArn?: string;
}

/**
 * S3 assembly artifact options uses a given S3 bucket for artifacts handling.
 */
export class S3AssemblyArtifactOptions extends AssemblyArtifactOptions {

  private readonly awsCredsStep: github.JobStep[];

  private readonly bucket: string;

  private readonly seed: string;

  constructor(props: S3AssemblyArtifactOptionsProps) {
    super();
    this.bucket = props.bucket;
    this.seed = props.seed ?? uuidv4();

    const provider = props.awsCreds ?? AwsCredentials.fromGitHubSecrets();
    this.awsCredsStep = provider.credentialSteps(props.region, props.assumeRoleArn);
  }

  downloadAssemblySteps(targetName: string, targetDir: string): github.JobStep[] {
    return [
      ...this.awsCredsStep,
      {
        name: `Download ${targetName} from S3`,
        run: ['aws s3 sync', `s3://${this.bucket}/${this.seed}/${targetName}`, targetDir].join(' '),
      },
    ];
  }

  uploadAssemblySteps(sourceName: string, sourceDir: string): github.JobStep[] {
    return [
      ...this.awsCredsStep,
      {
        name: `Upload ${sourceName} to S3`,
        run: ['aws s3 sync', sourceDir, `s3://${this.bucket}/${this.seed}/${sourceName}`].join(' '),
      },
    ];
  }
}
