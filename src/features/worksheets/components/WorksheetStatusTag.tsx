import { Tag } from 'antd';
import type { ContentStatus } from '@phonics/contracts';
import { t } from '@/shared/i18n';

const COLORS: Record<ContentStatus, string> = { DRAFT: 'warning', PUBLISHED: 'success', ARCHIVED: 'default' };

export function WorksheetStatusTag({ status }: { status: ContentStatus }) {
  return <Tag color={COLORS[status]}>{t.contentStatus[status]}</Tag>;
}
