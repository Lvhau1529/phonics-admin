import { EyeOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select, Space, Tooltip } from 'antd';
import { UserStatus, type StudentSummary } from '@phonics/contracts';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/routes';
import { useAuth } from '@/features/auth/hooks';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { MoveClassModal } from '@/features/students/components/MoveClassModal';
import { StudentsTable } from '@/features/students/components/StudentsTable';
import { useStudentsList } from '@/features/students/hooks';
import { useTableQuery } from '@/shared/hooks/useTableQuery';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

export function StudentsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const table = useTableQuery({ filterKeys: ['classId', 'status'] as const, defaultSort: 'createdAt:desc' });
  const list = useStudentsList(table.params);
  const [moving, setMoving] = useState<StudentSummary>();
  const canMove = auth.can('class.changeStudentClass');

  return (
    <>
      <PageHeader title={t.students.title}>
        <Flex gap={8} wrap>
          <Input.Search
            allowClear
            placeholder={t.common.searchPlaceholder}
            defaultValue={table.q}
            onSearch={(v) => table.setQ(v)}
            style={{ width: 260 }}
          />
          <ClassSelect
            placeholder={t.students.filterClass}
            value={table.filters.classId}
            onChange={(v) => table.setFilter('classId', v)}
          />
          <Select
            allowClear
            placeholder={t.students.filterStatus}
            value={table.filters.status as UserStatus | undefined}
            onChange={(v) => table.setFilter('status', v)}
            options={UserStatus.options.map((s) => ({ value: s, label: t.userStatus[s] }))}
            style={{ width: 150 }}
          />
        </Flex>
      </PageHeader>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <StudentsTable
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
            {canMove && (
              <Tooltip title={t.students.moveClass}>
                <Button type="text" icon={<SwapOutlined />} onClick={() => setMoving(s)} />
              </Tooltip>
            )}
          </Space>
        )}
      />
      <MoveClassModal student={moving} onClose={() => setMoving(undefined)} />
    </>
  );
}

export default StudentsPage;
