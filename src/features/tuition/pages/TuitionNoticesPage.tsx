import { CopyOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Collapse,
  DatePicker,
  Flex,
  Input,
  InputNumber,
  Radio,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { type ColumnsType } from 'antd/es/table';
import {
  DEFAULT_NOTICE_TEMPLATE,
  NOTICE_TEMPLATE_MAX,
  NOTICE_TEMPLATE_VARS,
  UpdateTuitionSettings,
} from '@phonics/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { ClassSelect } from '@/features/classes/components/ClassSelect';
import { TuitionService } from '@/features/tuition/api/tuitionService';
import { useSentMarks } from '@/features/tuition/components/useSentMarks';
import { type NoticePhoneIssue, type TuitionNoticeModel } from '@/features/tuition/models/TuitionNoticeModel';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { copyText } from '@/shared/utils/clipboard';
import { dayjs } from '@/shared/utils/dayjs';
import { formatMoney } from '@/shared/utils/format';
import { firstParseError, parseForm } from '@/shared/utils/zodForm';
import { DataTable } from '@/shared/ui/DataTable';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

type AmountMode = 'attendance' | 'flat';

const phoneIssueText = (issue: NoticePhoneIssue): string =>
  ({
    missing: t.tuitionNotices.phoneMissing,
    invalid: t.tuitionNotices.phoneInvalid,
    notMobile: t.tuitionNotices.phoneNotMobile,
  })[issue];

/**
 * Thông báo học phí qua Zalo cá nhân (ADMIN): chọn tháng (+ lớp), hệ thống soạn sẵn tin nhắn cho từng phụ huynh nhận
 * học phí; admin bấm "Sao chép" rồi "Mở Zalo" (zalo.me/<SĐT>) để dán và gửi. Số tiền lấy từ điểm danh học thêm hoặc
 * nhập số tiền chung mỗi bé, sửa riêng được từng dòng (không lưu). Đánh dấu "đã gửi" chỉ lưu trên trình duyệt.
 */
export function TuitionNoticesPage() {
  const { message } = App.useApp();
  const [month, setMonth] = useState(() => dayjs().subtract(1, 'month'));
  const [classId, setClassId] = useState<string>();
  const [mode, setMode] = useState<AmountMode>('attendance');
  const [flatAmount, setFlatAmount] = useState<number | null>(null);
  const [hideZero, setHideZero] = useState(true);
  /** undefined = theo cài đặt (ngày `dueDay` tháng sau); null = bỏ hạn đóng khỏi tin nhắn */
  const [dueOverride, setDueOverride] = useState<string | null>();
  /** Sửa số tiền từng dòng — gắn với phạm vi đang xem, đổi tháng / lớp / cách tính là bỏ */
  const [overrides, setOverrides] = useState<{ scope: string; values: Record<string, number> }>({
    scope: '',
    values: {},
  });
  const [draft, setDraft] = useState<string>();

  const monthKey = month.format('YYYY-MM');
  const notices = TuitionService.useNotices(monthKey, classId);
  const settings = TuitionService.useSettings();
  const update = TuitionService.useUpdateSettings();
  const data = notices.data;
  const scope = `${monthKey}|${classId ?? 'all'}`;
  const sent = useSentMarks(scope);
  const amountScope = `${scope}|${mode}`;
  const amountOverrides = overrides.scope === amountScope ? overrides.values : {};

  const savedTemplate = settings.data?.noticeTemplate ?? DEFAULT_NOTICE_TEMPLATE;
  const template = draft ?? savedTemplate;
  const templateDirty = draft !== undefined && draft !== savedTemplate;
  const dueDate = dueOverride === undefined ? (data?.dueDate ?? null) : dueOverride;

  const baseAmount = (n: TuitionNoticeModel) =>
    mode === 'flat' ? (flatAmount ?? 0) * n.students.length : n.attendanceTotal;
  const amountOf = (n: TuitionNoticeModel) => amountOverrides[n.key] ?? baseAmount(n);
  const messageOf = (n: TuitionNoticeModel) =>
    n.message({ template, month: monthKey, amount: amountOf(n), dueDate, settings: settings.data });

  const rows = (data?.items ?? []).filter((n) => !hideZero || amountOf(n) > 0);
  const sentCount = rows.filter((n) => sent.has(n.key)).length;
  // Bé chưa gắn phụ huynh nhận học phí đã có cảnh báo riêng
  const phoneIssues = rows.filter((n) => n.guardianId && n.phoneIssue).length;
  const noBilling = rows.filter((n) => !n.guardianId).length;
  const hasPending = mode === 'attendance' && rows.some((n) => n.pendingTotal > 0);
  const totalAmount = rows.reduce((sum, n) => sum + amountOf(n), 0);

  const setAmount = (key: string, value: number | null) =>
    setOverrides(() => {
      const values = { ...amountOverrides };
      if (value === null) delete values[key];
      else values[key] = value;
      return { scope: amountScope, values };
    });

  const handleCopy = async (n: TuitionNoticeModel) => {
    if (await copyText(messageOf(n))) message.success(t.tuitionNotices.copied);
    else message.error(t.tuitionNotices.copyFailed);
  };

  const handleSaveTemplate = async () => {
    if (!settings.data || draft === undefined) return;
    const trimmed = draft.trim();
    const parsed = parseForm(
      UpdateTuitionSettings,
      settings.data.toUpdateBody({
        // Trùng mẫu mặc định / để trống → không lưu (luôn theo mẫu mặc định mới nhất)
        noticeTemplate: trimmed && trimmed !== DEFAULT_NOTICE_TEMPLATE ? trimmed : undefined,
      }),
    );
    if (!parsed.success) return void message.error(firstParseError(parsed));
    try {
      await update.mutateAsync(parsed.data);
      setDraft(undefined);
      message.success(t.tuitionNotices.templateSaved);
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const buildColumns = (): ColumnsType<TuitionNoticeModel> => [
    {
      title: t.tuitionNotices.parent,
      key: 'parent',
      render: (_, n) => (
        <Flex vertical gap={2}>
          {n.guardianName ? (
            <Typography.Text strong>{n.guardianName}</Typography.Text>
          ) : (
            <Tag color="warning">{t.tuitionNotices.noBillingParent}</Tag>
          )}
          {n.phoneText && <Typography.Text type="secondary">{n.phoneText}</Typography.Text>}
          {n.guardianId && n.phoneIssue && (
            <Tooltip title={t.tuitionNotices.phoneIssueHint}>
              <Link
                to={`${ROUTES.guardians}${n.guardianName ? `?q=${encodeURIComponent(n.guardianName)}` : ''}`}
              >
                <Tag color="error">{phoneIssueText(n.phoneIssue)}</Tag>
              </Link>
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      title: t.tuitionNotices.students,
      key: 'students',
      render: (_, n) => (
        <Flex vertical gap={2}>
          {n.students.map((s) => (
            <Link key={s.id} to={`${ROUTES.studentDetail(s.id)}?tab=tuition`}>
              {s.englishName ? `${s.vietnameseName} (${s.englishName})` : s.vietnameseName}
            </Link>
          ))}
        </Flex>
      ),
    },
    {
      title: t.tuitionNotices.amount,
      key: 'amount',
      width: 170,
      render: (_, n) => (
        <Flex vertical gap={2}>
          <Tooltip title={t.tuitionNotices.editAmountHint}>
            <InputNumber<number>
              min={0}
              step={50_000}
              style={{ width: 150 }}
              value={amountOf(n)}
              formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => Number((v ?? '').replace(/\D/g, '')) || 0}
              onChange={(v) => setAmount(n.key, v)}
              aria-label={t.tuitionNotices.amount}
            />
          </Tooltip>
          {mode === 'attendance' && n.pendingTotal > 0 && (
            <Typography.Text type="warning" style={{ fontSize: 12 }}>
              {t.tuitionNotices.pendingPart(formatMoney(n.pendingTotal))}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: t.tuitionNotices.message,
      key: 'message',
      render: (_, n) => (
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0, width: 340 }}>
          {messageOf(n)}
        </Typography.Paragraph>
      ),
    },
    {
      title: t.tuitionNotices.actions,
      key: 'actions',
      fixed: 'right',
      render: (_, n) => (
        <Flex vertical gap={6} align="start">
          <Button size="small" icon={<CopyOutlined />} onClick={() => void handleCopy(n)}>
            {t.tuitionNotices.copy}
          </Button>
          <Tooltip title={n.phoneIssue ? phoneIssueText(n.phoneIssue) : undefined}>
            <Button
              size="small"
              type="primary"
              icon={<MessageOutlined />}
              href={n.zaloUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!n.zaloUrl}
              onClick={() => sent.set(n.key, true)}
            >
              {t.tuitionNotices.openZalo}
            </Button>
          </Tooltip>
          <Checkbox checked={sent.has(n.key)} onChange={(e) => sent.set(n.key, e.target.checked)}>
            {t.tuitionNotices.sent}
          </Checkbox>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.tuitionNotices.title}
        subtitle={t.tuitionNotices.subtitle}
        backTo={ROUTES.tuition}
        extra={
          <Link to={ROUTES.tuitionSettings}>
            <Button icon={<SettingOutlined />}>{t.tuitionSettings.open}</Button>
          </Link>
        }
      />
      <ErrorAlert error={notices.error ?? settings.error} onRetry={() => void notices.refetch()} />
      <Flex vertical gap={16}>
        <Card size="small">
          <Flex gap={16} wrap align="end">
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{t.tuitionNotices.month}</Typography.Text>
              <DatePicker
                picker="month"
                format={t.attendance.monthFormat}
                allowClear={false}
                value={month}
                onChange={(value) => {
                  if (!value) return;
                  setMonth(value);
                  setDueOverride(undefined);
                }}
              />
            </Flex>
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{t.tuitionNotices.class}</Typography.Text>
              <ClassSelect value={classId} onChange={setClassId} placeholder={t.tuitionNotices.classAll} />
            </Flex>
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{t.tuitionNotices.amountSource}</Typography.Text>
              <Space wrap>
                <Radio.Group
                  optionType="button"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as AmountMode)}
                  options={[
                    { value: 'attendance', label: t.tuitionNotices.fromAttendance },
                    { value: 'flat', label: t.tuitionNotices.flat },
                  ]}
                />
                {mode === 'flat' && (
                  <InputNumber<number>
                    min={0}
                    step={50_000}
                    style={{ width: 170 }}
                    placeholder={t.tuitionNotices.flatAmount}
                    value={flatAmount}
                    formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(v) => Number((v ?? '').replace(/\D/g, '')) || 0}
                    onChange={setFlatAmount}
                    suffix="đ"
                  />
                )}
              </Space>
            </Flex>
            <Flex vertical gap={4}>
              <Typography.Text type="secondary">{t.tuitionNotices.dueDate}</Typography.Text>
              <DatePicker
                format={t.format.date}
                value={dueDate ? dayjs(dueDate) : null}
                onChange={(value) => setDueOverride(value ? value.format('YYYY-MM-DD') : null)}
                placeholder={t.tuitionNotices.noDueDate}
              />
            </Flex>
            <Checkbox checked={hideZero} onChange={(e) => setHideZero(e.target.checked)}>
              {t.tuitionNotices.hideZero}
            </Checkbox>
          </Flex>
        </Card>

        <Collapse
          items={[
            {
              key: 'template',
              label: (
                <Flex gap={8} align="center" wrap>
                  <span>{t.tuitionNotices.template}</span>
                  {templateDirty && <Tag color="processing">{t.tuitionNotices.unsaved}</Tag>}
                </Flex>
              ),
              children: (
                <Flex vertical gap={8}>
                  <Input.TextArea
                    autoSize={{ minRows: 5, maxRows: 12 }}
                    maxLength={NOTICE_TEMPLATE_MAX}
                    showCount
                    value={template}
                    onChange={(e) => setDraft(e.target.value)}
                    aria-label={t.tuitionNotices.template}
                  />
                  <Typography.Text type="secondary" style={{ marginTop: 16 }}>
                    {t.tuitionNotices.templateHint(NOTICE_TEMPLATE_VARS.join(' '))}
                  </Typography.Text>
                  <Space wrap>
                    <Button
                      type="primary"
                      loading={update.isPending}
                      disabled={!templateDirty || !settings.data}
                      onClick={() => void handleSaveTemplate()}
                    >
                      {t.tuitionNotices.saveTemplate}
                    </Button>
                    <Button
                      disabled={template === DEFAULT_NOTICE_TEMPLATE}
                      onClick={() => setDraft(DEFAULT_NOTICE_TEMPLATE)}
                    >
                      {t.tuitionNotices.resetTemplate}
                    </Button>
                  </Space>
                </Flex>
              ),
            },
          ]}
        />

        {settings.data && !settings.data.accountNo && (
          <Alert
            type="info"
            showIcon
            message={t.tuitionNotices.bankMissing}
            action={
              <Link to={ROUTES.tuitionSettings}>
                <Button size="small">{t.tuitionSettings.open}</Button>
              </Link>
            }
          />
        )}
        {mode === 'flat' && !flatAmount && (
          <Alert type="warning" showIcon message={t.tuitionNotices.flatMissing} />
        )}
        {hasPending && <Alert type="warning" showIcon message={t.tuitionNotices.pendingWarning} />}
        {!!phoneIssues && (
          <Alert type="warning" showIcon message={t.tuitionNotices.phoneIssues(phoneIssues)} />
        )}
        {!!noBilling && (
          <Alert type="warning" showIcon message={t.tuitionNotices.noBillingWarning(noBilling)} />
        )}

        <Card
          title={
            <Flex gap={12} wrap align="center">
              <span>{t.tuitionNotices.progress(sentCount, rows.length)}</span>
              <Typography.Text type="secondary" style={{ fontWeight: 'normal' }}>
                {t.tuitionNotices.totalAmount(formatMoney(totalAmount))}
              </Typography.Text>
            </Flex>
          }
          extra={
            <Tooltip title={t.tuitionNotices.sentHint}>
              <Button size="small" disabled={!sentCount} onClick={sent.clear}>
                {t.tuitionNotices.resetSent}
              </Button>
            </Tooltip>
          }
        >
          <DataTable.Static<TuitionNoticeModel>
            rowKey="key"
            loading={notices.isFetching}
            columns={buildColumns()}
            dataSource={data ? rows : undefined}
            pagination={false}
            locale={{ emptyText: t.tuitionNotices.empty }}
          />
        </Card>
      </Flex>
    </>
  );
}

export default TuitionNoticesPage;
