import { describe, expect, it } from 'vitest';
import { SceneManager } from '../../src/core/SceneManager';
import type { GameContext, GameScene, SceneId } from '../../src/core/Scene';

function createScene(id: SceneId, events: string[]): GameScene {
  return {
    id,
    enter: () => events.push(`${id}:enter`),
    exit: () => events.push(`${id}:exit`),
    update: () => events.push(`${id}:update`),
    resize: () => events.push(`${id}:resize`),
    render: () => events.push(`${id}:render`),
    dispose: () => events.push(`${id}:dispose`),
  };
}

describe('SceneManager', () => {
  it('enters, exits, and tracks active scenes', () => {
    const events: string[] = [];
    const context = {
      uiRoot: { replaceChildren: () => undefined },
      getSize: () => ({ width: 1280, height: 720 }),
    } as unknown as GameContext;
    const manager = new SceneManager(context);

    manager.register(createScene('desktop', events));
    manager.register(createScene('bedroom', events));

    manager.switchTo('desktop');
    manager.switchTo('bedroom');

    expect(manager.getActiveSceneId()).toBe('bedroom');
    expect(events).toEqual([
      'desktop:resize',
      'desktop:enter',
      'desktop:exit',
      'bedroom:resize',
      'bedroom:enter',
    ]);
  });

  it('throws on unknown scenes', () => {
    const context = {
      uiRoot: { replaceChildren: () => undefined },
      getSize: () => ({ width: 1, height: 1 }),
    } as unknown as GameContext;
    const manager = new SceneManager(context);

    expect(() => manager.switchTo('shop')).toThrow('unknown scene');
  });
});
