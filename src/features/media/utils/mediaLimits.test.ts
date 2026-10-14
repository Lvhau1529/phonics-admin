import { describe, expect, it } from 'vitest';
import { acceptFor, maxMb, validateFile } from '@/features/media/utils/mediaLimits';

describe('mediaLimits', () => {
  it('validateFile: mime / size theo loại', () => {
    expect(validateFile({ type: 'image/png', size: 1000 }, 'IMAGE')).toEqual({ ok: true });
    expect(validateFile({ type: 'image/gif', size: 1000 }, 'IMAGE')).toEqual({ ok: false, reason: 'type' });
    expect(validateFile({ type: 'image/png', size: 6 * 1024 * 1024 }, 'IMAGE')).toEqual({
      ok: false,
      reason: 'size',
    });
    expect(validateFile({ type: 'audio/webm;codecs=opus', size: 10 }, 'AUDIO')).toEqual({ ok: true });
    expect(validateFile({ type: 'audio/webm', size: 0 }, 'AUDIO')).toEqual({ ok: false, reason: 'size' });
  });
  it('accept / maxMb', () => {
    expect(acceptFor('IMAGE')).toContain('image/png');
    expect(maxMb('IMAGE')).toBe(5);
    expect(maxMb('AUDIO')).toBe(10);
  });
});
