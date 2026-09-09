import {ProcessTimelineAttachment, ProcessTimelineAttachmentType} from '../../../../generated/prisma/client';

export class ProcessTimelineAttachmentEntity implements ProcessTimelineAttachment
{
    id:         string;
    numId:      number;
    commentId:  string;
    uploadedBy: string;
    type:       ProcessTimelineAttachmentType;
    fileKey:    string;
    fileUrl:    string;
    fileName:   string;
    fileSize:   number;
    mimeType:   string;
    deletedAt:  Date | null;
    createdAt:  Date;
    updatedAt:  Date;
}
