import { App, Button, Drawer, Flex, Form, Input, Switch } from 'antd';
import {
  ClassName,
  CreateClassBody,
  Grade,
  SchoolYear,
  UpdateClassBody,
  type ClassSummary,
} from '@phonics/contracts';
import { useEffect } from 'react';
import { useCreateClass, useUpdateClass } from '@/features/classes/hooks';
import { TeacherSelect } from '@/features/teachers/components/TeacherSelect';
import { errorMessage } from '@/shared/api/errors';
import { t } from '@/shared/i18n/vi';
import {
  applyFieldErrors,
  applyServerErrors,
  diffValues,
  parseForm,
  stripEmpty,
  zodRule,
} from '@/shared/utils/zodForm';

interface ClassFormValues {
  name: string;
  grade: string;
  schoolYear: string;
  joinVisible: boolean;
  teacherIds?: string[];
}

interface ClassFormDrawerProps {
  open: boolean;
  cls?: ClassSummary;
  onClose: () => void;
}

/** Năm học mặc định cho lớp mới: tháng ≥ 8 → năm nay–năm sau, ngược lại năm trước–năm nay */
function currentSchoolYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** Tạo / sửa lớp (ADMIN). Giáo viên chỉ chọn lúc tạo; sửa sau bằng AssignTeachersModal. */
export function ClassFormDrawer({ open, cls, onClose }: ClassFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ClassFormValues>();
  const create = useCreateClass();
  const update = useUpdateClass();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (cls) {
      form.setFieldsValue({
        name: cls.name,
        grade: cls.grade,
        schoolYear: cls.schoolYear,
        joinVisible: cls.joinVisible,
      });
    } else {
      form.setFieldsValue({ joinVisible: true, schoolYear: currentSchoolYear(), teacherIds: [] });
    }
  }, [open, cls, form]);

  const handleFinish = async (raw: ClassFormValues) => {
    const values = stripEmpty(raw as unknown as Record<string, unknown>) as unknown as ClassFormValues;
    try {
      if (cls) {
        const diff = diffValues(
          { name: cls.name, grade: cls.grade, schoolYear: cls.schoolYear, joinVisible: cls.joinVisible },
          {
            name: values.name,
            grade: values.grade,
            schoolYear: values.schoolYear,
            joinVisible: values.joinVisible,
          },
        );
        if (Object.keys(diff).length === 0) return void message.info(t.common.noChanges);
        const parsed = parseForm(UpdateClassBody, diff);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await update.mutateAsync({ id: cls.id, body: parsed.data });
        message.success(t.common.updated);
      } else {
        const parsed = parseForm(CreateClassBody, values);
        if (!parsed.success) return applyFieldErrors(form, parsed.fieldErrors);
        await create.mutateAsync(parsed.data);
        message.success(t.common.created);
      }
      onClose();
    } catch (error) {
      if (!applyServerErrors(form, error)) message.error(errorMessage(error));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={cls ? t.classes.edit : t.classes.add}
      width={420}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button type="primary" loading={create.isPending || update.isPending} onClick={() => form.submit()}>
            {t.common.save}
          </Button>
        </Flex>
      }
    >
      <Form<ClassFormValues> form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label={t.classes.name}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(ClassName)]}
        >
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item
          name="grade"
          label={t.classes.grade}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(Grade)]}
        >
          <Input maxLength={20} />
        </Form.Item>
        <Form.Item
          name="schoolYear"
          label={t.classes.schoolYear}
          extra={t.classes.schoolYearHint}
          rules={[{ required: true, message: t.common.requiredField }, zodRule(SchoolYear)]}
        >
          <Input placeholder="2026-2027" />
        </Form.Item>
        <Form.Item name="joinVisible" label={t.classes.joinVisible} valuePropName="checked">
          <Switch />
        </Form.Item>
        {!cls && (
          <Form.Item name="teacherIds" label={t.classes.teachers}>
            <TeacherSelect mode="multiple" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
