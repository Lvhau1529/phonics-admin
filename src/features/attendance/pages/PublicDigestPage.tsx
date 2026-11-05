import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, Checkbox, Flex, Result, Skeleton, Typography } from 'antd';
import { CancelDigestBody } from '@phonics/contracts';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '@/app/routes';
import { AttendanceService } from '@/features/attendance/api/attendanceService';
import { AttendanceStatusTag } from '@/features/attendance/components/AttendanceStatusTag';
import { ReportOffModal } from '@/features/attendance/components/ReportOffModal';
import { type DigestSessionModel } from '@/features/attendance/models/AttendanceSessionModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { THEME_COLORS } from '@/shared/theme/theme';
import { useThemeMode } from '@/shared/theme/themeStore';
import { BrandMark } from '@/shared/ui/BrandMark';
import { LangSwitch } from '@/shared/ui/LangSwitch';
import { ThemeSwitch } from '@/shared/ui/ThemeSwitch';
import { formatDateTime, sessionDateText } from '@/shared/utils/format';

interface Outcome {
  ok: boolean;
  text: string;
}

function SessionRow({
  session,
  checked,
  onToggle,
  onReportOff,
}: {
  session: DigestSessionModel;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onReportOff: () => void;
}) {
  return (
    <Card size="small">
      <Flex gap={12} align="flex-start" justify="space-between" wrap>
        <Checkbox
          checked={checked}
          disabled={!session.canConfirm}
          onChange={(e) => onToggle(e.target.checked)}
        >
          <Flex vertical>
            <Typography.Text strong>{session.title}</Typography.Text>
            <Typography.Text type="secondary">
              {session.dateText} · {session.timeRange} · {session.countText}
            </Typography.Text>
          </Flex>
        </Checkbox>
        <Flex vertical align="flex-end" gap={4}>
          <AttendanceStatusTag status={session.status} />
          {session.confirmedText && (
            <Typography.Text type="secondary">{session.confirmedText}</Typography.Text>
          )}
          {session.changed && session.status === 'PENDING' && (
            <Link to={ROUTES.attendanceSession(session.id)}>{t.publicDigest.changedSignIn}</Link>
          )}
          {session.canReportOff && (
            <Button size="small" type="text" danger icon={<StopOutlined />} onClick={onReportOff}>
              {t.publicDigest.reportOff}
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

/**
 * Trang public từ mail 21:00: GV bấm "Duyệt" / "Duyệt tất cả" mà không cần đăng nhập. Mở link chỉ HIỂN THỊ (bộ quét
 * link của mail tự GET); duyệt bằng POST khi bấm nút.
 */
export function PublicDigestPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const digest = AttendanceService.useDigest(token);
  const confirm = AttendanceService.useConfirmDigest(token);
  const cancel = AttendanceService.useCancelDigest(token);
  /** Lựa chọn người dùng đã đổi; null = mặc định (buổi trong link `?session=`, không có thì mọi buổi duyệt được) */
  const [picked, setPicked] = useState<string[] | null>(null);
  const [outcome, setOutcome] = useState<Outcome>();
  const colors = THEME_COLORS[useThemeMode()];
  const data = digest.data;
  const preselect = searchParams.get('session');
  /** Buổi đang báo nghỉ — link "Nghỉ" trong mail (`?session=…&action=cancel`) mở sẵn hộp báo nghỉ */
  const [offId, setOffId] = useState<string | null>(() =>
    searchParams.get('action') === 'cancel' ? preselect : null,
  );
  const offSession = data?.sessions.find((s) => s.id === offId && s.canReportOff);

  useEffect(() => {
    document.title = t.app.title(t.publicDigest.title);
  }, []);

  const submit = async (sessionIds: string[]) => {
    if (!sessionIds.length) return;
    try {
      const res = await confirm.mutateAsync(sessionIds);
      setOutcome({
        ok: res.rejected.length === 0,
        text: t.publicDigest.outcome(res.confirmed.length, res.alreadyConfirmed.length, res.rejected.length),
      });
      setPicked([]);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const confirmable = data?.sessions.filter((s) => s.canConfirm) ?? [];
  const confirmableIds = confirmable.map((s) => s.id);
  const defaultPick = preselect && confirmableIds.includes(preselect) ? [preselect] : confirmableIds;
  const selected = (picked ?? defaultPick).filter((id) => confirmableIds.includes(id));
  const toggle = (id: string, checked: boolean) =>
    setPicked(checked ? [...selected, id] : selected.filter((x) => x !== id));
  let body;
  if (digest.error) {
    body = <Result status="warning" title={t.publicDigest.invalid} subTitle={errorMessage(digest.error)} />;
  } else if (!data) {
    body = <Skeleton active />;
  } else {
    body = (
      <Flex vertical gap={16}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t.publicDigest.greeting(data.teacherName)}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t.publicDigest.subtitle(sessionDateText(data.date), formatDateTime(data.expiresAt))}
          </Typography.Text>
        </div>
        {outcome && <Alert type={outcome.ok ? 'success' : 'warning'} showIcon message={outcome.text} />}
        <Flex vertical gap={8}>
          {data.sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              checked={selected.includes(s.id)}
              onToggle={(checked) => toggle(s.id, checked)}
              onReportOff={() => setOffId(s.id)}
            />
          ))}
        </Flex>
        {confirmable.length > 0 ? (
          <Flex gap={8} justify="flex-end" wrap>
            <Button
              disabled={!selected.length}
              loading={confirm.isPending}
              onClick={() => void submit(selected)}
            >
              {t.publicDigest.confirmSelected(selected.length)}
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={confirm.isPending}
              onClick={() => void submit(confirmable.map((s) => s.id))}
            >
              {t.publicDigest.confirmAll(confirmable.length)}
            </Button>
          </Flex>
        ) : (
          <Typography.Text type="secondary">{t.publicDigest.nothingLeft}</Typography.Text>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {t.publicDigest.editHint} <Link to={ROUTES.attendance}>{t.publicDigest.signInToEdit}</Link>
        </Typography.Text>
      </Flex>
    );
  }

  return (
    <Flex
      justify="center"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: colors.bgLayout,
        padding: '72px 16px 16px',
      }}
    >
      <Flex gap={12} style={{ position: 'absolute', top: 16, right: 16 }}>
        <LangSwitch />
        <ThemeSwitch />
      </Flex>
      <Card style={{ width: '100%', maxWidth: 640, alignSelf: 'flex-start' }}>
        <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
          <BrandMark size={32} />
          <Typography.Text strong>{t.publicDigest.title}</Typography.Text>
        </Flex>
        {body}
      </Card>
      {offSession && (
        <ReportOffModal
          open
          title={t.publicDigest.reportOffTitle(offSession.title)}
          hint={t.publicDigest.reportOffHint}
          loading={cancel.isPending}
          schema={CancelDigestBody}
          toBody={(reason) => ({ sessionIds: [offSession.id], reason })}
          onSubmit={async (body) => {
            const res = await cancel.mutateAsync(body);
            setOffId(null);
            setOutcome({
              ok: res.rejected.length === 0,
              text: t.publicDigest.cancelOutcome(
                res.cancelled.length,
                res.alreadyCancelled.length,
                res.rejected.length,
              ),
            });
          }}
          onClose={() => setOffId(null)}
        />
      )}
    </Flex>
  );
}

export default PublicDigestPage;
