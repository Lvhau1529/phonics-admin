import { PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Flex, List, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AssignWorksheetModal } from '@/features/assignments/components/AssignWorksheetModal';
import { AssignmentActions } from '@/features/assignments/components/AssignmentActions';
import { AssignmentStatusTag } from '@/features/assignments/components/AssignmentStatusTag';
import type { AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import { useAuth } from '@/features/auth/hooks';
import { t } from '@/shared/i18n';
import { formatDate } from '@/shared/utils/format';

interface AssignmentDayDrawerProps {
  /** ISO date đang mở; null = đóng */
  date: string | null;
  items: AssignmentModel[];
  classId?: string;
  onClose: () => void;
}

/** Bài giao trong một ngày trên lịch + nút giao thêm */
export function AssignmentDayDrawer({ date, items, classId, onClose }: AssignmentDayDrawerProps) {
  const auth = useAuth();
  const [assignOpen, setAssignOpen] = useState(false);
  return (
    <Drawer
      open={date !== null}
      onClose={onClose}
      width={480}
      title={date ? t.assignments.dayTitle(formatDate(date)) : ''}
      extra={
        auth.can('worksheets.assign') && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>
            {t.assignments.assignOnDay}
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        <Empty description={t.assignments.noAssignments} />
      ) : (
        <List
          dataSource={items}
          renderItem={(a) => (
            <List.Item actions={[<AssignmentActions key="a" assignment={a} />]}>
              <List.Item.Meta
                title={<Link to={ROUTES.assignmentDetail(a.id)}>{a.worksheetTitle}</Link>}
                description={
                  <Flex vertical gap={4}>
                    <Typography.Text type="secondary">
                      {a.className} · {a.windowText}
                    </Typography.Text>
                    <Flex gap={4} wrap>
                      <AssignmentStatusTag status={a.status} />
                      <Tag>
                        {t.assignments.submitted} {a.submittedRatioText}
                      </Tag>
                      {a.pendingGrading > 0 && (
                        <Tag color="warning">
                          {t.assignments.pendingGrading}: {a.pendingGrading}
                        </Tag>
                      )}
                    </Flex>
                  </Flex>
                }
              />
            </List.Item>
          )}
        />
      )}
      {date && (
        <AssignWorksheetModal
          open={assignOpen}
          classId={classId}
          scheduledFor={date}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </Drawer>
  );
}
