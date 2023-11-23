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
