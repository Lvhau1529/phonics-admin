import { Flex, Typography, theme } from 'antd';
import type { QuestionAnswer, QuestionAnswerKey, QuestionConfig, QuestionExample } from '@phonics/contracts';
import {
  InlineChoiceRenderer,
  MultipleChoiceRenderer,
  OddOneOutRenderer,
  PatternNextRenderer,
} from '@/features/questions/renderers/choiceRenderers';
import { MediaImage, type RendererMode } from '@/features/questions/renderers/common';
import { CrosswordRenderer, WordSearchRenderer } from '@/features/questions/renderers/gridRenderers';
import { SpeakRenderer, TraceAndReadRenderer } from '@/features/questions/renderers/manualRenderers';
import {
  FillBlankRenderer,
  MissingSoundRenderer,
  NumberPicturesRenderer,
  PickLettersRenderer,
  UnscrambleWordRenderer,
  WordOrderRenderer,
} from '@/features/questions/renderers/textRenderers';

export interface QuestionRendererProps {
  config: QuestionConfig;
  answerKey?: QuestionAnswerKey | null;
  answer?: QuestionAnswer | null;
  mode: RendererMode;
  onChange?: (answer: QuestionAnswer) => void;
  parts?: Record<string, boolean>;
  /** Hướng dẫn + ví dụ hiện phía trên (bỏ qua ở bảng chấm khi đã hiện riêng) */
  instruction?: string;
  example?: QuestionExample | null;
}

/**
 * Chọn renderer theo `config.type`. Cùng một component cho preview (editor), thử làm (try) và review (chấm bài).
 * `answerKey` / `answer` nào không đúng type bị bỏ qua (null) để không crash khi dữ liệu lệch.
 */
export function QuestionRenderer({
  config,
  answerKey,
  answer,
  mode,
  onChange,
  parts,
  instruction,
  example,
}: QuestionRendererProps) {
  const { token } = theme.useToken();
  const key = answerKey && answerKey.type === config.type ? answerKey : null;
  const ans = answer && answer.type === config.type ? answer : null;
  const common = { mode, onChange, parts };

  let body: React.ReactNode;
  switch (config.type) {
    case 'MISSING_SOUND':
      body = (
        <MissingSoundRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'CROSSWORD':
      body = <CrosswordRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />;
      break;
    case 'UNSCRAMBLE_WORD':
      body = (
        <UnscrambleWordRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'PICK_LETTERS':
      body = (
        <PickLettersRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'WORD_SEARCH':
      body = (
        <WordSearchRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'ODD_ONE_OUT':
      body = <OddOneOutRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />;
      break;
    case 'PATTERN_NEXT':
      body = (
        <PatternNextRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'NUMBER_PICTURES':
      body = (
        <NumberPicturesRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'MULTIPLE_CHOICE':
      body = (
        <MultipleChoiceRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'FILL_BLANK_WORD_BANK':
      body = <FillBlankRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />;
      break;
    case 'WORD_ORDER':
      body = <WordOrderRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />;
      break;
    case 'INLINE_CHOICE':
      body = (
        <InlineChoiceRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'TRACE_AND_READ':
      body = (
        <TraceAndReadRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />
      );
      break;
    case 'SPEAK':
      body = <SpeakRenderer config={config} answerKey={key as never} answer={ans as never} {...common} />;
      break;
  }

  return (
    <Flex vertical gap={10}>
      {instruction && (
        <Typography.Text strong style={{ fontSize: 15 }}>
          {instruction}
        </Typography.Text>
      )}
      {example && (
        <Flex
          gap={8}
          align="center"
          style={{
            padding: '6px 10px',
            borderRadius: token.borderRadius,
            background: token.colorFillQuaternary,
            border: `1px dashed ${token.colorBorder}`,
          }}
        >
          <Typography.Text italic strong>
            E.g.
          </Typography.Text>
          <MediaImage id={example.imageMediaId} size={40} />
          <Typography.Text italic>{example.text}</Typography.Text>
        </Flex>
      )}
      {body}
    </Flex>
  );
}
