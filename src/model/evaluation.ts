export interface PolicyEvaluationRecord {
    evaluationId: string;
    startedDate: string;
    status: 'queued' | 'running' | 'approved' | 'rejected' | 'notApplicable' | 'broken';
    configuration: {
        isBlocking: boolean;
        type: {
            displayName: string;
        }
    }
    context: {
        buildDefinitionName?: string;
        buildId?: number;
        buildOutputPreview?: {
            jobName: string;
            taskName: string;
            errors: {message: string}[];
        }
    }
}