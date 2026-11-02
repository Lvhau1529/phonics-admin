import { ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Skeleton } from 'antd';
import { FamiliesService } from '@/features/families/api/familiesService';
import { PendingFamilyCard } from '@/features/families/components/PendingFamilyCard';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

/** Duyệt tài khoản tự đăng ký (ADMIN mọi đơn; GV chỉ bé đăng ký vào lớp mình — server lọc) */
export function FamiliesPendingPage() {
  const pending = FamiliesService.usePending();

  return (
    <>
      <PageHeader
        title={t.families.title}
        subtitle={t.families.subtitle}
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={pending.isFetching}
            onClick={() => void pending.refetch()}
          >
            {t.common.refresh}
          </Button>
        }
      />
      <ErrorAlert error={pending.error} onRetry={() => void pending.refetch()} />
      {pending.isLoading && <Skeleton active />}
      {pending.data && pending.data.length === 0 && <Empty description={t.families.empty} />}
      <Flex vertical gap={16}>
        {/* key gồm danh sách bé: đơn đổi (duyệt một phần, gộp) thì card nạp lại lựa chọn / lớp */}
        {pending.data?.map((family) => (
          <PendingFamilyCard
            key={`${family.id}:${family.children.map((c) => c.studentId).join(',')}`}
            family={family}
          />
        ))}
      </Flex>
    </>
  );
}

export default FamiliesPendingPage;
