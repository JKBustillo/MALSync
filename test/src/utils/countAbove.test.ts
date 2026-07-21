import { expect } from 'chai';
import { countAbove } from '../../../src/utils/mangaProgress/modes/countAbove';

// Fake reader image: only the bits countAbove touches.
const img = (top: number, height: number, naturalWidth: number) => ({
  naturalWidth,
  getBoundingClientRect: () => ({ top, bottom: top + height, left: 0, width: 800, height }),
});

describe('countAbove', function () {
  let els: any[] = [];

  this.beforeAll(function () {
    (global as any).window = { innerHeight: 1000, innerWidth: 1000 };
    (global as any).document = { documentElement: { clientHeight: 1000, clientWidth: 1000 } };
    (global as any).j = { $: () => els };
  });

  const run = () => new countAbove().getProgress({ selector: '.x' } as any);

  it('ignores not-yet-loaded lazy images collapsed above the fold', function () {
    // el0 loaded and read; el1/el2 unloaded (naturalWidth 0) collapsed into the
    // viewport. Without the guard the active element would be el2 -> count 3.
    els = [img(-100, 900, 720), img(800, 50, 0), img(850, 50, 0), img(2000, 50, 0)];
    expect(run()).to.equal(1);
  });

  it('counts loaded images normally', function () {
    els = [img(-900, 900, 720), img(-100, 900, 720), img(3000, 900, 720)];
    expect(run()).to.equal(2);
  });
});
