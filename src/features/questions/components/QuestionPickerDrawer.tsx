import { Button, Drawer, Flex, Input, Segmented, Select, Tag, Typography } from 'antd';
import { QUESTION_TYPES, type QuestionType } from '@phonics/contracts';
import { useState } from 'react';
import { QuestionBankTable } from '@/features/questions/components/QuestionBankTable';
import { QuestionsService } from '@/features/questions/api/questionsService';
import type { QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { t } from '@/shared/i18n';
import { ErrorAlert } from '@/shared/ui/ErrorAlert';

interface QuestionPickerDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Câu đã có trong phiếu (không chọn lại) */
  excludeIds: readonly string[];
  onAdd: (questions: QuestionSummaryModel[]) => void;
}

/** Chọn nhiều câu hỏi (đã phát hành) từ ngân hàng để thêm vào phiếu; giữ lựa chọn qua nhiều trang */
export function QuestionPickerDrawer({ open, onClose, excludeIds, onAdd }: QuestionPickerDrawerProps) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<QuestionType>();
  const [mine, setMine] = useState<'all' | 'mine'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<string | undefined>('updatedAt:desc');
  const [selected, setSelected] = useState<Map<string, QuestionSummaryModel>>(new Map());
  const debounced = useDebouncedValue(q.trim());
  const list = QuestionsService.useList({
    page,
    pageSize,
    sort,
    q: debounced || undefined,
    type,
    status: 'PUBLISHED',
    mine: mine === 'mine' ? true : undefined,
  });
  const disabled = new Set(excludeIds);

  const handleAdd = () => {
    onAdd([...selected.values()]);
    setSelected(new Map());
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={960}
      title={t.questions.pickFromBank}
      destroyOnHidden
      footer={
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary">
            {[...selected.values()].slice(0, 3).map((s) => (
              <Tag key={s.id}>{s.instruction.slice(0, 30)}</Tag>
            ))}
            {selected.size > 3 && <Tag>+{selected.size - 3}</Tag>}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={onClose}>{t.common.cancel}</Button>
            <Button type="primary" disabled={!selected.size} onClick={handleAdd}>
              {t.questions.addSelected(selected.size)}
            </Button>
          </Flex>
        </Flex>
      }
    >
      <Flex gap={8} wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder={t.common.search}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          style={{ width: 240 }}
        />
        <Select<QuestionType>
          allowClear
          placeholder={t.questions.filterType}
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
          options={QUESTION_TYPES.map((x) => ({ value: x, label: t.questionType[x] }))}
          style={{ width: 240 }}
        />
        <Segmented<'all' | 'mine'>
          value={mine}
          onChange={(v) => {
            setMine(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t.questions.all },
            { value: 'mine', label: t.questions.mine },
          ]}
        />
      </Flex>
      <ErrorAlert error={list.error} onRetry={() => void list.refetch()} />
      <QuestionBankTable
        data={list.data}
        loading={list.isFetching}
        page={page}
        pageSize={pageSize}
        sort={sort}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onSortChange={setSort}
        renderTitle={(x) => (
          <Typography.Text strong>
            {x.instruction}
            {disabled.has(x.id) && <Tag style={{ marginLeft: 8 }}>{t.questions.alreadyInWorksheet}</Tag>}
          </Typography.Text>
        )}
        rowSelection={{
          selectedIds: [...selected.keys()],
          disabledIds: disabled,
          onChange: (ids, rows) => {
            const next = new Map<string, QuestionSummaryModel>();
            for (const id of ids) {
              const row = rows.find((r) => r?.id === id) ?? selected.get(id);
              if (row) next.set(id, row);
            }
            setSelected(next);
          },
        }}
      />
    </Drawer>
  );
}
