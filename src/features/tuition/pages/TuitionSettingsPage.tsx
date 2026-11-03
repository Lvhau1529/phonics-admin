import { Alert, App, Button, Card, Col, Form, Input, InputNumber, Row, Select, Typography } from 'antd';
import {
  BankAccountNo,
  BankBin,
  Phone,
  SUGGESTED_TRANSFER_CONTENT,
  TRANSFER_CONTENT_VARS,
  UpdateTuitionSettings,
  VN_BANKS,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { ROUTES } from '@/app/routes';
import { TuitionService } from '@/features/tuition/api/tuitionService';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n';
import { formatDateTime } from '@/shared/utils/format';
import { applyFieldErrors, applyServerErrors, parseForm, stripEmpty, zodRule } from '@/shared/utils/zodForm';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';
import { PageHeader } from '@/shared/ui/PageHeader';

interface SettingsFormValues {
  orgName?: string;
  orgAddress?: string;
  orgPhone?: string;
  bankBin?: string;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  transferContent?: string;
  dueDay?: number | null;
  note?: string;
}

const BANK_OPTIONS = VN_BANKS.map((b) => ({ value: b.bin, label: `${b.name} (${b.bin})` }));

/** Cài đặt in trên phiếu báo học phí (ADMIN). Ô để trống = không in lên phiếu */
export function TuitionSettingsPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<SettingsFormValues>();
  const settings = TuitionService.useSettings();
  const update = TuitionService.useUpdateSettings();
  const data = settings.data;

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      orgName: data.orgName ?? undefined,
      orgAddress: data.orgAddress ?? undefined,
      orgPhone: data.orgPhone ?? undefined,
      bankBin: data.bankBin ?? undefined,
      bankName: data.bankName ?? undefined,
      accountNo: data.accountNo ?? undefined,
      accountName: data.accountName ?? undefined,
      // Chưa từng lưu: gợi ý sẵn mẫu nội dung chuyển khoản
      transferContent: data.transferContent ?? (data.updatedAt ? undefined : SUGGESTED_TRANSFER_CONTENT),
      dueDay: data.dueDay,
      note: data.note ?? undefined,
    });
  }, [data, form]);

  /** Chọn ngân hàng trong danh sách → điền tên + mã BIN */
  const pickBank = (bin: string) => {
    const bank = VN_BANKS.find((b) => b.bin === bin);
    if (bank) form.setFieldsValue({ bankBin: bank.bin, bankName: bank.name });
  };

  const handleFinish = async (raw: SettingsFormValues) => {
    const values = stripEmpty({ ...raw, dueDay: raw.dueDay ?? undefined });
    const parsed = parseForm(UpdateTuitionSettings, values);
    if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
    try {
      await update.mutateAsync(parsed.data);
      message.success(t.common.saved);
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title={t.tuitionSettings.title}
        subtitle={t.tuitionSettings.subtitle}
        backTo={ROUTES.tuition}
        extra={
          <Button type="primary" loading={update.isPending} disabled={!data} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        }
      />
      <ErrorAlert error={settings.error} onRetry={() => void settings.refetch()} />
      <Form<SettingsFormValues> form={form} layout="vertical" onFinish={handleFinish} disabled={!data}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={t.tuitionSettings.orgSection}>
              <Form.Item name="orgName" label={t.tuitionSettings.orgName}>
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item name="orgAddress" label={t.tuitionSettings.orgAddress}>
                <Input maxLength={200} />
              </Form.Item>
              <Form.Item name="orgPhone" label={t.tuitionSettings.orgPhone} rules={[zodRule(Phone)]}>
                <Input />
              </Form.Item>
              <Form.Item name="dueDay" label={t.tuitionSettings.dueDay} extra={t.tuitionSettings.dueDayHint}>
                <InputNumber min={1} max={28} precision={0} style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="note" label={t.tuitionSettings.note} extra={t.tuitionSettings.noteHint}>
                <Input.TextArea rows={3} maxLength={500} />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t.tuitionSettings.bankSection}>
              <Form.Item label={t.tuitionSettings.pickBank}>
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={BANK_OPTIONS}
                  placeholder={t.tuitionSettings.pickBankPlaceholder}
                  onChange={(bin?: string) => bin && pickBank(bin)}
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item name="bankName" label={t.tuitionSettings.bankName}>
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="bankBin"
                    label={t.tuitionSettings.bankBin}
                    tooltip={t.tuitionSettings.bankBinHint}
                    rules={[zodRule(BankBin)]}
                  >
                    <Input maxLength={6} inputMode="numeric" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="accountNo"
                label={t.tuitionSettings.accountNo}
                rules={[zodRule(BankAccountNo)]}
              >
                <Input maxLength={30} />
              </Form.Item>
              <Form.Item name="accountName" label={t.tuitionSettings.accountName}>
                <Input maxLength={60} />
              </Form.Item>
              <Form.Item
                name="transferContent"
                label={t.tuitionSettings.transferContent}
                extra={t.tuitionSettings.transferContentHint(TRANSFER_CONTENT_VARS.join(' '))}
              >
                <Input maxLength={60} />
              </Form.Item>
              <Alert
                type={data?.qrReady ? 'success' : 'info'}
                showIcon
                message={data?.qrReady ? t.tuitionSettings.qrReady : t.tuitionSettings.qrHint}
              />
            </Card>
          </Col>
        </Row>
      </Form>
      <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
        {t.tuitionSettings.emptyHint}
        {data?.updatedAt && ` · ${t.common.updatedAt}: ${formatDateTime(data.updatedAt)}`}
      </Typography.Paragraph>
    </>
  );
}

export default TuitionSettingsPage;
