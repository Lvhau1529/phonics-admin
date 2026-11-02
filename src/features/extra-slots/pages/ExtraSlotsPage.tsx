import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Empty, Flex, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '@/features/auth/authStore';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { ExtraSlotsService } from '@/features/extra-slots/api/extraSlotsService';
import { ExtraSlotFormDrawer } from '@/features/extra-slots/components/ExtraSlotFormDrawer';
import { SlotCard } from '@/features/extra-slots/components/SlotCard';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { t } from '@/shared/i18n';
import type { IsoWeekday } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { BlockSkeleton } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';

const WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Ca học thêm: lưới tuần T2–CN (ADMIN mọi ca, GV ca mình dạy — server lọc) */
export function ExtraSlotsPage() {
  const { can, role } = useAuth();
  const [teacherId, setTeacherId] = useState<string>();
  const [classId, setClassId] = useState<string>();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const list = ExtraSlotsService.useList({
    teacherId,
    classId,
    includeArchived: includeArchived ? 'true' : undefined,
  });
  const slots = list.data ?? [];

  return (
    <>
      <PageHeader
        title={t.extraSlots.title}
        extra={
          can('extra.manageSlots') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
              {t.extraSlots.add}
            </Button>
          )
        }
      >
        <Flex gap={8} wrap align="center">
          {role === 'ADMIN' && (
            <TeacherSelect
              value={teacherId}
              onChange={(v) => setTeacherId(typeof v === 'string' ? v : undefined)}
            />
          )}
          <ClassSelect value={classId} onChange={setClassId} />
          <Checkbox checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)}>
            {t.extraSlots.showArchived}
          </Checkbox>
        </Flex>
      </PageHeader>

      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      {!list.data && list.isLoading ? (
        <BlockSkeleton />
      ) : slots.length === 0 ? (
        <Empty description={t.extraSlots.noSlots} />
      ) : (
        // Bảy cột ngang trên màn rộng, tự xuống dòng trên màn hẹp
        <Flex gap={12} wrap align="flex-start">
          {WEEKDAYS.map((day) => {
            const daySlots = slots
              .filter((s) => s.weekday === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <Card
                key={day}
                size="small"
                title={t.weekday[day]}
                style={{ flex: '1 1 170px', minWidth: 170 }}
                styles={{ body: { padding: 8 } }}
              >
                <Flex vertical gap={8}>
                  {daySlots.length ? (
                    daySlots.map((slot) => <SlotCard key={slot.id} slot={slot} />)
                  ) : (
                    <Typography.Text type="secondary">{t.extraSlots.emptyDay}</Typography.Text>
                  )}
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}

      <ExtraSlotFormDrawer open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

export default ExtraSlotsPage;
