import {ProcessTimelineStage, TimelineStage} from '../../../../generated/prisma/client';

export class ProcessTimelineStageEntity implements ProcessTimelineStage
{
    id:              string;
    numId:           number;
    processId:       string;
    firmId:          string;
    stage:           TimelineStage;
    microStageLabel: string | null;
    createdBy:       string;
    deletedAt:       Date | null;
    createdAt:       Date;
    updatedAt:       Date;
}
