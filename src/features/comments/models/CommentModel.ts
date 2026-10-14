import type { AvatarKey, CommentReply, CommentView, Role } from '@phonics/contracts';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';

/** Một nhận xét (gốc hoặc reply) */
export class CommentModel {
  readonly id: string;
  readonly submissionId: string;
  readonly worksheetItemId: string | null;
  readonly authorId: string;
  readonly authorName: string;
  readonly authorRole: Role;
  readonly authorAvatarKey: AvatarKey;
  readonly parentId: string | null;
  readonly body: string;
  readonly deleted: boolean;
  readonly createdAt: string;
  readonly editedAt: string | null;
  readonly replies: CommentModel[];

  constructor(data: CommentView | CommentReply) {
    this.id = data.id;
    this.submissionId = data.submissionId;
    this.worksheetItemId = data.worksheetItemId;
    this.authorId = data.authorId;
    this.authorName = data.authorName;
    this.authorRole = data.authorRole;
    this.authorAvatarKey = data.authorAvatarKey;
    this.parentId = data.parentId;
    this.body = data.body;
    this.deleted = data.deleted;
    this.createdAt = data.createdAt;
    this.editedAt = data.editedAt;
    this.replies = 'replies' in data ? data.replies.map((r) => new CommentModel(r)) : [];
  }

  get isStudent(): boolean {
    return this.authorRole === 'STUDENT';
  }

  get isEdited(): boolean {
    return this.editedAt !== null;
  }

  get bodyText(): string {
    return this.deleted ? t.comments.deletedBody : this.body;
  }

  get createdText(): string {
    return formatDateTime(this.createdAt);
  }

  isMine(userId: string | undefined): boolean {
    return !!userId && this.authorId === userId;
  }
}
