import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { forgetUser } from '../../../db/history.js';
import { en, fr, messagesFor } from '../../i18n.js';

export const data = new SlashCommandBuilder()
    .setName('forget-me')
    .setDescription(en.forgetMe.description)
    .setDescriptionLocalizations({ fr: fr.forgetMe.description })
    .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
    ])
    .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
    ]);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const { db } = interaction.client as BotClient;
    const { history, preferences, games } = forgetUser(db, interaction.user.id);

    const t = messagesFor(interaction.locale).forgetMe;
    const total = history + preferences + games;
    const msg = total === 0 ? t.nothing : t.done(history, preferences, games);

    return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
};
