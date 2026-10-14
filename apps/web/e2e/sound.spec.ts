import { expect, test } from '@playwright/test';

const SOUNDS = [
  'click',
  'ring',
  'answer',
  'type',
  'static',
  'scan',
  'correct',
  'wrong',
  'level-complete',
  'squeak',
  'thud',
  'ping',
  'drain',
  'reveal',
  'key',
  'boot',
  'unlock',
  'paperclip',
];

test('every placeholder sound is served from /audio', async ({ request }) => {
  for (const name of SOUNDS) {
    const response = await request.get(`/audio/${name}.wav`);
    expect(response.ok(), `${name}.wav`).toBe(true);
    expect(response.headers()['content-type'], `${name}.wav`).toContain('audio');
    // A real WAV, not the app's HTML served as a fallback.
    expect((await response.body()).subarray(0, 4).toString('latin1'), `${name}.wav`).toBe('RIFF');
  }
});

test('START TRAINING unlocks audio and loads the sounds', async ({ page }) => {
  await page.goto('/');
  const loaded = SOUNDS.map((name) =>
    page.waitForResponse((response) => response.url().endsWith(`/audio/${name}.wav`)),
  );

  await page.getByRole('button', { name: 'START TRAINING' }).click();

  for (const response of await Promise.all(loaded)) expect(response.ok()).toBe(true);
});

test('the mute toggle is remembered across reloads', async ({ page }) => {
  await page.goto('/');
  // Named by what it shows, so the name changes with the state.
  const toggle = page.getByRole('button', { name: /^Sound o(n|ff)$/ });
  await expect(toggle).toHaveAccessibleName('Sound on');

  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Sound off');

  await page.reload();
  await expect(toggle).toHaveAccessibleName('Sound off');

  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Sound on');
});
