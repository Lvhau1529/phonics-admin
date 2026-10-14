import { DeleteOutlined, DragOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Flex,
  Input,
  InputNumber,
  Select,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes';
import { QuestionTypeTag } from '@/features/questions/components/QuestionTypeTag';
import type { ComposerAction, DraftItem, DraftSection } from '@/features/worksheets/composerReducer';
import { t } from '@/shared/i18n';
import { DragHandle, SortableList } from '@/shared/ui/SortableList';

interface WorksheetSectionsEditorProps {
  sections: DraftSection[];
  dispatch: (action: ComposerAction) => void;
  onAddFromBank: (sectionKey: string) => void;
  onCreateInline: (sectionKey: string) => void;
  readOnly?: boolean;
}

function ItemCard({
  item,
  section,
  sections,
  dispatch,
  readOnly,
  handleProps,
}: {
  item: DraftItem;
  section: DraftSection;
  sections: DraftSection[];
  dispatch: (a: ComposerAction) => void;
  readOnly?: boolean;
  handleProps: Parameters<typeof DragHandle>[0]['handleProps'];
}) {
  const { token } = theme.useToken();
  const q = item.question;
  return (
    <Flex
      gap={10}
      align="center"
      style={{
        padding: 8,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        background: token.colorBgContainer,
      }}
    >
      {!readOnly && <DragHandle handleProps={handleProps} />}
      <Avatar shape="square" size={40} src={q.thumbnailUrl}>
        {q.typeLabel.charAt(0)}
      </Avatar>
      <Flex vertical style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong ellipsis>
          {q.instruction}
        </Typography.Text>
        <Flex gap={4} wrap>
          <QuestionTypeTag type={q.type} />
          {!q.isPublished && <Tag color={q.statusColor}>{t.contentStatus[q.status]}</Tag>}
        </Flex>
      </Flex>
      <InputNumber
        size="small"
        min={1}
        max={100}
        precision={0}
        value={item.pointsOverride ?? undefined}
        placeholder={t.worksheets.pointsDefault(q.points)}
        disabled={readOnly}
        onChange={(v) =>
          dispatch({ type: 'setPoints', sectionKey: section.key, itemKey: item.key, points: v ?? null })
        }
        style={{ width: 120 }}
        suffix={t.questions.points}
      />
      {!readOnly && sections.length > 1 && (
        <Select
          size="small"
          value={section.key}
          onChange={(toKey) =>
            dispatch({ type: 'moveItemToSection', itemKey: item.key, fromKey: section.key, toKey })
          }
          options={sections.map((s) => ({ value: s.key, label: s.title }))}
          style={{ width: 110 }}
          suffixIcon={<DragOutlined />}
        />
      )}
      <Tooltip title={t.worksheets.openQuestion}>
        <Link to={ROUTES.questionDetail(q.id)} target="_blank">
          <Button type="text" icon={<LinkOutlined />} />
        </Link>
      </Tooltip>
      {!readOnly && (
        <Tooltip title={t.worksheets.removeItem}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => dispatch({ type: 'removeItem', sectionKey: section.key, itemKey: item.key })}
          />
        </Tooltip>
      )}
    </Flex>
  );
}

/** Các Part + câu: kéo thả thứ tự trong Part, chuyển Part bằng ô chọn, thêm từ ngân hàng / tạo mới */
export function WorksheetSectionsEditor({
  sections,
  dispatch,
  onAddFromBank,
  onCreateInline,
  readOnly,
}: WorksheetSectionsEditorProps) {
  return (
    <Flex vertical gap={12}>
      <SortableList
        items={sections.map((s) => s.key)}
        onMove={(from, to) => dispatch({ type: 'moveSection', from, to })}
        disabled={readOnly}
        gap={12}
      >
        {(key, state, index) => {
          const section = sections[index];
          if (!section || section.key !== key) return null;
          return (
            <Card
              size="small"
              title={
                <Flex gap={8} align="center">
                  {!readOnly && <DragHandle handleProps={state.handleProps} />}
                  <Typography.Text type="secondary">{t.worksheets.section(index + 1)}</Typography.Text>
                  <Input
                    size="small"
                    value={section.title}
                    maxLength={60}
                    disabled={readOnly}
                    onChange={(e) =>
                      dispatch({ type: 'updateSection', key, patch: { title: e.target.value } })
                    }
                    style={{ width: 200, fontWeight: 600 }}
                  />
                  <Tag>{t.worksheets.items(section.items.length)}</Tag>
                </Flex>
              }
              extra={
                !readOnly && (
                  <Flex gap={4}>
                    <Button size="small" icon={<PlusOutlined />} onClick={() => onAddFromBank(key)}>
                      {t.worksheets.addFromBank}
                    </Button>
                    <Button size="small" onClick={() => onCreateInline(key)}>
                      {t.worksheets.createInline}
                    </Button>
                    <Tooltip title={t.worksheets.removeSection}>
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={sections.length <= 1}
                        onClick={() => dispatch({ type: 'removeSection', key })}
                      />
                    </Tooltip>
                  </Flex>
                )
              }
            >
              <Flex vertical gap={8}>
                <Input
                  size="small"
                  placeholder={t.worksheets.sectionInstruction}
                  value={section.instruction}
                  maxLength={300}
                  disabled={readOnly}
                  onChange={(e) =>
                    dispatch({ type: 'updateSection', key, patch: { instruction: e.target.value } })
                  }
                />
                {section.items.length === 0 ? (
                  <Typography.Text type="secondary">{t.worksheets.noItems}</Typography.Text>
                ) : (
                  <SortableList
                    items={section.items.map((it) => it.key)}
                    onMove={(from, to) => dispatch({ type: 'moveItem', sectionKey: key, from, to })}
                    disabled={readOnly}
                  >
                    {(itemKey, itemState, i) => {
                      const item = section.items[i];
                      if (!item || item.key !== itemKey) return null;
                      return (
                        <ItemCard
                          item={item}
                          section={section}
                          sections={sections}
                          dispatch={dispatch}
                          readOnly={readOnly}
                          handleProps={itemState.handleProps}
                        />
                      );
                    }}
                  </SortableList>
                )}
              </Flex>
            </Card>
          );
        }}
      </SortableList>
      {!readOnly && (
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => dispatch({ type: 'addSection' })}>
          {t.worksheets.addSection}
        </Button>
      )}
    </Flex>
  );
}
