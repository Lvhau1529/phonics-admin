import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Flex, Select, Tag } from 'antd';
import type { AssignmentRosterRow } from '@phonics/contracts';
import { useEffect } from 'react';
import { t } from '@/shared/i18n';

interface StudentNavProps {
  roster: AssignmentRosterRow[] | undefined;
  currentSubmissionId: string;
  onSelect: (submissionId: string) => void;
}

const submissionOf = (r: AssignmentRosterRow) => r.latestSubmissionId ?? r.bestSubmissionId;

/** Chuyển nhanh giữa học sinh đã nộp (phím [ / ]) */
export function StudentNav({ roster, currentSubmissionId, onSelect }: StudentNavProps) {
  const rows = (roster ?? []).filter((r) => submissionOf(r) !== null);
  const idx = rows.findIndex((r) => submissionOf(r) === currentSubmissionId);
  const prev = idx > 0 ? rows[idx - 1] : undefined;
  const next = idx >= 0 && idx < rows.length - 1 ? rows[idx + 1] : undefined;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (e.key === '[' && prev) onSelect(submissionOf(prev)!);
      if (e.key === ']' && next) onSelect(submissionOf(next)!);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next, onSelect]);

  return (
    <Flex gap={6} align="center">
      <Button
        size="small"
        icon={<LeftOutlined />}
        disabled={!prev}
        onClick={() => prev && onSelect(submissionOf(prev)!)}
        title={`${t.grading.prev} [`}
      />
      <Select<string>
        size="small"
        value={idx >= 0 ? currentSubmissionId : undefined}
        onChange={onSelect}
        style={{ width: 220 }}
        options={rows.map((r) => ({
          value: submissionOf(r)!,
          label: (
            <Flex gap={6} align="center">
              {r.displayName}
              <Tag
                style={{ marginInlineEnd: 0 }}
                color={
                  r.status === 'GRADED' ? 'success' : r.status === 'SUBMITTED' ? 'processing' : 'default'
                }
              >
                {t.rosterStatus[r.status]}
              </Tag>
            </Flex>
          ),
        }))}
      />
      <Button
        size="small"
        icon={<RightOutlined />}
        disabled={!next}
        onClick={() => next && onSelect(submissionOf(next)!)}
        title={`${t.grading.next} ]`}
      />
    </Flex>
  );
}
