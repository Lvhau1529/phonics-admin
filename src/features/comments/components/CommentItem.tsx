import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Popconfirm, Tag, Typography, theme } from 'antd';
import { useState } from 'react';
import { CommentComposer } from '@/features/comments/components/CommentComposer';
import type { CommentModel } from '@/features/comments/models/CommentModel';
import { t } from '@/shared/i18n';
import { AvatarImg } from '@/shared/ui/AvatarImg';

interface CommentItemProps {
  comment: CommentModel;
  currentUserId: string | undefined;
  canModerate: boolean;
  onEdit: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  children?: React.ReactNode;
}

/** Một nhận xét (gốc hoặc trả lời) + sửa / xoá nếu là của mình (hoặc admin) */
export function CommentItem({
  comment,
  currentUserId,
  canModerate,
  onEdit,
  onDelete,
  children,
}: CommentItemProps) {
  const { token } = theme.useToken();
  const [editing, setEditing] = useState(false);
  const mine = comment.isMine(currentUserId);
  const canEdit = mine && !comment.deleted;
  const canDelete = (mine || canModerate) && !comment.deleted;
  return (
    <Flex gap={8} align="flex-start">
      <AvatarImg avatarKey={comment.authorAvatarKey} name={comment.authorName} size="small" />
      <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Flex gap={6} align="center" wrap>
          <Typography.Text strong>{comment.authorName}</Typography.Text>
          {comment.isStudent && <Tag color="blue">{t.comments.byStudent}</Tag>}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {comment.createdText}
            {comment.isEdited ? ` · ${t.comments.edited}` : ''}
          </Typography.Text>
          {canEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
              title={t.comments.edit}
            />
          )}
          {canDelete && (
            <Popconfirm
              title={t.comments.confirmDelete}
              okText={t.common.confirm}
              cancelText={t.common.cancel}
              onConfirm={() => onDelete(comment.id)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} title={t.comments.delete} />
            </Popconfirm>
          )}
        </Flex>
        {editing ? (
          <CommentComposer
            initial={comment.body}
            autoFocus
            onCancel={() => setEditing(false)}
            onSubmit={async (body) => {
              await onEdit(comment.id, body);
              setEditing(false);
            }}
          />
        ) : (
          <Typography.Paragraph
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              color: comment.deleted ? token.colorTextTertiary : undefined,
            }}
            italic={comment.deleted}
          >
            {comment.bodyText}
          </Typography.Paragraph>
        )}
        {children}
      </Flex>
    </Flex>
  );
}
