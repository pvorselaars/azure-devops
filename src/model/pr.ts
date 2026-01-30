import { PolicyEvaluationRecord } from "./evaluation"

export interface PullRequest {
    pullRequestId: number
    title: string
    description: string
    createdBy: {
        displayName: string
        _links: {
            avatar: {
                href: string
            }
        }
    }
    creationDate: string
    closedDate?: string
    status: string
    isDraft: boolean
    sourceRefName: string
    targetRefName: string
    reviewers: [{
        displayName: string
        vote: number
    }]
    approvals?: {
        received: number
        required: number
        complete: number
    }
    policies?: PolicyEvaluationRecord[]
    comments?: number
    passRate?: number
    lastMergeSourceCommit: {
        commitId: string;
    }
    lastMergeTargetCommit: {
        commitId: string
    }
    iterations?: number
    repository: {
        id: string
        name: string
        project: {
            id: string
            name: string
        }
    }
    url: string
}