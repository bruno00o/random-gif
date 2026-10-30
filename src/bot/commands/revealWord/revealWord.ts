import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getByMessageId } from '../../../db/history.js';
import { getVisibility } from '../../../db/preferences.js';
import { en, fr, messagesFor } from '../../i18n.js';

export const data = new ContextMenuCommandBuilder()
    .setName(en.revealWord.name)
    .setNameLocalizations({ fr: fr.revealWord.name })
    .setType(ApplicationCommandType.Message)
    .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
    ])
    .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
    ]);

export const execute = async (interaction: MessageContextMenuCommandInteraction) => {
    const { db } = interaction.client as BotClient;
    const target = interaction.targetMessage;
    const t = messagesFor(interaction.locale).revealWord;

    if (target.author.id !== interaction.client.user?.id) {
        return interaction.reply({
            content: t.notOurs,
            flags: MessageFlags.Ephemeral,
        });
    }

    const entry = getByMessageId(db, target.id);
    if (!entry) {
        return interaction.reply({
            content: t.unknown,
            flags: MessageFlags.Ephemeral,
        });
    }

    const isSelf = entry.user_id === interaction.user.id;
    if (!isSelf && getVisibility(db, entry.user_id) === 'private') {
        return interaction.reply({
            content: t.private,
            flags: MessageFlags.Ephemeral,
        });
    }

    const reveal = entry.word_source === 'user' ? t.searched : t.random;
    return interaction.reply({
        content: reveal(`<@${entry.user_id}>`, entry.word),
        flags: MessageFlags.Ephemeral,
    });
};
