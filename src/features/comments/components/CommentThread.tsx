import { App, Button, Flex, Typography, theme } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { CommentComposer } from '@/features/comments/components/CommentComposer';
import { CommentItem } from '@/features/comments/components/CommentItem';
import { CommentsService } from '@/features/comments/api/commentsService';
import type { CommentModel } from '@/features/comments/models/CommentModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';

interface CommentThreadProps {
  submissionId: string;
  /** null = nhận xét chung cả bài */
  worksheetItemId: string | null;
  /** Đã lọc theo worksheetItemId (chỉ comment gốc, replies nằm trong) */
  comments: CommentModel[];
  canComment: boolean;
  /** Gọn (trong thẻ chấm từng câu) */
  compact?: boolean;
}

/** Luồng nhận xét 1 cấp: gốc → trả lời; GV tạo gốc / trả lời, HS chỉ trả lời (trên game) */
export function CommentThread({
  submissionId,
  worksheetItemId,
  comments,
  canComment,
  compact,
}: CommentThreadProps) {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const auth = useAuth();
  const create = CommentsService.useCreate(submissionId);
  const update = CommentsService.useUpdate(submissionId);
  const remove = CommentsService.useRemove(submissionId);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [composing, setComposing] = useState(!compact);

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) message.success(success);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };
  const onEdit = (id: string, body: string) => run(() => update.mutateAsync({ id, body: { body } }));
  const onDelete = (id: string) => run(() => remove.mutateAsync(id));
  const post = (body: string, parentId?: string) =>
    run(async () => {
      await create.mutateAsync({ body, worksheetItemId: worksheetItemId ?? undefined, parentId });
      setReplyTo(null);
      if (compact) setComposing(false);
    }, t.comments.sent);

  return (
    <Flex vertical gap={12}>
      {comments.length === 0 && !compact && (
        <Typography.Text type="secondary">{t.comments.none}</Typography.Text>
      )}
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          currentUserId={auth.user?.id}
          canModerate={auth.isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        >
          {c.replies.length > 0 && (
            <Flex
              vertical
              gap={8}
              style={{ marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${token.colorBorderSecondary}` }}
            >
              {c.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  currentUserId={auth.user?.id}
                  canModerate={auth.isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </Flex>
          )}
          {canComment && !c.deleted && (
            <div style={{ marginTop: 4 }}>
              {replyTo === c.id ? (
                <CommentComposer
                  autoFocus
                  placeholder={t.comments.replyPlaceholder}
                  loading={create.isPending}
                  onCancel={() => setReplyTo(null)}
                  onSubmit={(body) => post(body, c.id)}
                />
              ) : (
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setReplyTo(c.id)}>
                  {t.comments.reply}
                </Button>
              )}
            </div>
          )}
        </CommentItem>
      ))}
      {canComment &&
        (composing ? (
          <CommentComposer
            loading={create.isPending}
            onCancel={compact ? () => setComposing(false) : undefined}
            onSubmit={(body) => post(body)}
          />
        ) : (
          <Button size="small" onClick={() => setComposing(true)} style={{ alignSelf: 'flex-start' }}>
            {t.grading.itemComments}
          </Button>
        ))}
    </Flex>
  );
}
