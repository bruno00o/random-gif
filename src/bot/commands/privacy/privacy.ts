import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getVisibility, setVisibility, type Visibility } from '../../../db/preferences.js';

export const data = new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('Control who can see your random-gif history and stats')
    .addStringOption((option) =>
        option
            .setName('visibility')
            .setDescription('public = others can view · private = only you (default)')
            .setRequired(true)
            .addChoices(
                { name: 'public', value: 'public' },
                { name: 'private', value: 'private' },
            ),
    )
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
    const visibility = interaction.options.getString('visibility', true) as Visibility;
    const { db } = interaction.client as BotClient;

    const current = getVisibility(db, interaction.user.id);
    if (current === visibility) {
        return interaction.reply({
            content: `Your history is already **${visibility}**.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    setVisibility(db, interaction.user.id, visibility);

    const msg =
        visibility === 'public'
            ? '🌍 Your history and stats are now **public**. Others can view them.'
            : '🔒 Your history and stats are now **private**. Only you can view them.';

    return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
};
