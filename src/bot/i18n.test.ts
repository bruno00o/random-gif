import { describe, expect, it } from 'vitest';
import { en, fr, messagesFor } from './i18n.js';
import { data as forgetMe } from './commands/forgetMe/forgetMe.js';
import { data as guess } from './commands/guess/guess.js';
import { data as history } from './commands/history/history.js';
import { data as privacy } from './commands/privacy/privacy.js';
import { data as randomGif } from './commands/randomGif/randomGif.js';
import { data as revealWord } from './commands/revealWord/revealWord.js';
import { data as stats } from './commands/stats/stats.js';

const collectStrings = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') {
        return [(value as (...args: unknown[]) => string)('x', 'y', 'z')];
    }
    return Object.values(value as object).flatMap(collectStrings);
};

describe('i18n', () => {
    it('picks French for every French locale and English otherwise', () => {
        expect(messagesFor('fr')).toBe(fr);
        expect(messagesFor('en-US')).toBe(en);
        expect(messagesFor('ja')).toBe(en);
    });

    it.each([
        ['en', en],
        ['fr', fr],
    ])('keeps %s free of emoji, exclamation marks, em dashes and middle dots', (_name, messages) => {
        for (const text of collectStrings(messages)) {
            expect(text).not.toMatch(/[!—·]|\p{Extended_Pictographic}/u);
        }
    });

    it('uses non-breaking spaces before French double punctuation', () => {
        for (const text of collectStrings(fr)) {
            expect(text).not.toMatch(/ [:;?]/);
        }
    });

    it.each([
        ['forget-me', forgetMe],
        ['guess', guess],
        ['history', history],
        ['privacy', privacy],
        ['random-gif', randomGif],
        ['stats', stats],
    ])('localizes the descriptions of /%s, options included', (_name, command) => {
        const json = command.toJSON();
        expect(json.description_localizations?.fr).toBeTruthy();
        for (const option of json.options ?? []) {
            expect(option.description_localizations?.fr).toBeTruthy();
        }
    });

    it('localizes the context menu name while keeping the registration key', () => {
        const json = revealWord.toJSON();
        expect(json.name).toBe('Reveal word');
        expect(json.name_localizations?.fr).toBe('Révéler le mot');
    });

    it('localizes the privacy choices', () => {
        const [option] = privacy.toJSON().options ?? [];
        expect(option).toMatchObject({
            choices: [
                { value: 'public', name_localizations: { fr: 'public' } },
                { value: 'private', name_localizations: { fr: 'privé' } },
            ],
        });
    });
});
