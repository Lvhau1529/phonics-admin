import { EyeOutlined, PlusCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Space, Tooltip } from 'antd';
import type { StudentModel } from '@/features/students/models/StudentModel';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { BonusPointsModal } from '@/features/classes/components/BonusPointsModal';
import { useClassStudents } from '@/features/classes/hooks';
import { MoveClassModal } from '@/features/students/components/MoveClassModal';
import { StudentsTable } from '@/features/students/components/StudentsTable';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

interface ClassStudentsTabProps {
  classId: string;
}

/** Tab Học sinh của lớp: bảng điểm / hạng, chuyển lớp (quyền), cộng điểm nhanh (quyền) */
export function ClassStudentsTab({ classId }: ClassStudentsTabProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const table = useTableQuery({ defaultSort: 'points:desc' });
  const list = useClassStudents(classId, table.params);
  const [moving, setMoving] = useState<StudentModel>();
  const [bonusFor, setBonusFor] = useState<StudentModel>();
  const canMove = auth.can('class.changeStudentClass');
  const canAward = auth.can('points.award');

  return (
    <>
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder={t.common.searchPlaceholder}
          defaultValue={table.q}
          onSearch={(v) => table.setQ(v)}
          style={{ width: 260 }}
        />
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <StudentsTable
        hideClass
        data={list.data}
        loading={list.isFetching}
        page={table.page}
        pageSize={table.pageSize}
        sort={table.sort}
        onPageChange={table.setPage}
        onSortChange={table.setSort}
        renderActions={(s) => (
          <Space size={0}>
            <Tooltip title={t.common.view}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => navigate(ROUTES.studentDetail(s.id))}
              />
            </Tooltip>
            {canAward && (
              <Tooltip title={t.classes.tabBonus}>
                <Button type="text" icon={<PlusCircleOutlined />} onClick={() => setBonusFor(s)} />
              </Tooltip>
            )}
            {canMove && (
              <Tooltip title={t.classes.moveStudent}>
                <Button type="text" icon={<SwapOutlined />} onClick={() => setMoving(s)} />
              </Tooltip>
            )}
          </Space>
        )}
      />
      <MoveClassModal student={moving} onClose={() => setMoving(undefined)} />
      <BonusPointsModal
        classId={classId}
        open={!!bonusFor}
        studentId={bonusFor?.id}
        onClose={() => setBonusFor(undefined)}
      />
    </>
  );
}
