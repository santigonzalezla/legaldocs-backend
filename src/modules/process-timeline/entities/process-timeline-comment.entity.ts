import {ProcessTimelineComment} from '../../../../generated/prisma/client';

export class ProcessTimelineCommentEntity implements ProcessTimelineComment
{
    id:            string;
    numId:         number;
    stageId:       string;
    processId:     string;
    body:          string;
    commentDate:   Date | null;
    responsibleId: string | null;
    createdBy:     string;
    deletedAt:     Date | null;
    createdAt:     Date;
    updatedAt:     Date;
}
