import {
  InlineChoiceEditor,
  MultipleChoiceEditor,
  OddOneOutEditor,
  PatternNextEditor,
} from '@/features/questions/components/editor/choiceEditors';
import { CrosswordEditor, WordSearchEditor } from '@/features/questions/components/editor/gridEditors';
import { SpeakEditor, TraceAndReadEditor } from '@/features/questions/components/editor/manualEditors';
import {
  FillBlankEditor,
  MissingSoundEditor,
  NumberPicturesEditor,
  PickLettersEditor,
  UnscrambleWordEditor,
  WordOrderEditor,
} from '@/features/questions/components/editor/textEditors';
import type { EditorProps } from '@/features/questions/components/editor/types';

/** Editor nội dung theo dạng câu hỏi */
export function TypeEditor(props: EditorProps) {
  switch (props.draft.type) {
    case 'MISSING_SOUND':
      return <MissingSoundEditor {...props} />;
    case 'CROSSWORD':
      return <CrosswordEditor {...props} />;
    case 'UNSCRAMBLE_WORD':
      return <UnscrambleWordEditor {...props} />;
    case 'PICK_LETTERS':
      return <PickLettersEditor {...props} />;
    case 'WORD_SEARCH':
      return <WordSearchEditor {...props} />;
    case 'ODD_ONE_OUT':
      return <OddOneOutEditor {...props} />;
    case 'PATTERN_NEXT':
      return <PatternNextEditor {...props} />;
    case 'NUMBER_PICTURES':
      return <NumberPicturesEditor {...props} />;
    case 'MULTIPLE_CHOICE':
      return <MultipleChoiceEditor {...props} />;
    case 'FILL_BLANK_WORD_BANK':
      return <FillBlankEditor {...props} />;
    case 'WORD_ORDER':
      return <WordOrderEditor {...props} />;
    case 'INLINE_CHOICE':
      return <InlineChoiceEditor {...props} />;
    case 'TRACE_AND_READ':
      return <TraceAndReadEditor {...props} />;
    case 'SPEAK':
      return <SpeakEditor {...props} />;
  }
}
