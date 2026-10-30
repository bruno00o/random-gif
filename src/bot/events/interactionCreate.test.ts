import { describe, expect, it, vi } from 'vitest';
import { Collection, Interaction } from 'discord.js';
import { execute } from './interactionCreate.js';

const makeButton = (customId: string, commands: Record<string, unknown>) =>
    ({
        isButton: () => true,
        isModalSubmit: () => false,
        customId,
        client: { commands: new Collection(Object.entries(commands)) },
    }) as unknown as Interaction;

const makeModal = (customId: string, commands: Record<string, unknown>) =>
    ({
        isButton: () => false,
        isModalSubmit: () => true,
        customId,
        client: { commands: new Collection(Object.entries(commands)) },
    }) as unknown as Interaction;

describe('interactionCreate modals', () => {
    it('routes a modal to the handler of the command named in its customId', async () => {
        const handleModal = vi.fn().mockResolvedValue(undefined);
        const interaction = makeModal('guess:answer', { guess: { handleModal } });

        await execute(interaction);

        expect(handleModal).toHaveBeenCalledWith(interaction);
    });

    it('logs instead of throwing when the command has no modal handler', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handleButton = vi.fn();

        await execute(makeModal('guess:answer', { guess: { handleButton } }));

        expect(handleButton).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});

describe('interactionCreate buttons', () => {
    it('routes a button to the handler of the command named in its customId', async () => {
        const handleButton = vi.fn().mockResolvedValue(undefined);
        const interaction = makeButton('random-gif:reroll', { 'random-gif': { handleButton } });

        await execute(interaction);

        expect(handleButton).toHaveBeenCalledWith(interaction);
    });

    it('logs instead of throwing when no handler matches', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(execute(makeButton('unknown:action', {}))).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('logs instead of throwing when the handler fails', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const handleButton = vi.fn().mockRejectedValue(new Error('boom'));

        await expect(
            execute(makeButton('random-gif:reroll', { 'random-gif': { handleButton } })),
        ).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
