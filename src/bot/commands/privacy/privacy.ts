import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getVisibility, setVisibility, type Visibility } from '../../../db/preferences.js';
import { en, fr, messagesFor } from '../../i18n.js';

export const data = new SlashCommandBuilder()
    .setName('privacy')
    .setDescription(en.privacy.description)
    .setDescriptionLocalizations({ fr: fr.privacy.description })
    .addStringOption((option) =>
        option
            .setName('visibility')
            .setDescription(en.privacy.visibilityOption)
            .setDescriptionLocalizations({ fr: fr.privacy.visibilityOption })
            .setRequired(true)
            .addChoices(
                {
                    name: en.privacy.publicChoice,
                    name_localizations: { fr: fr.privacy.publicChoice },
                    value: 'public',
                },
                {
                    name: en.privacy.privateChoice,
                    name_localizations: { fr: fr.privacy.privateChoice },
                    value: 'private',
                },
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
    const t = messagesFor(interaction.locale).privacy;

    const current = getVisibility(db, interaction.user.id);
    if (current === visibility) {
        return interaction.reply({
            content: visibility === 'public' ? t.alreadyPublic : t.alreadyPrivate,
            flags: MessageFlags.Ephemeral,
        });
    }

    setVisibility(db, interaction.user.id, visibility);

    const msg = visibility === 'public' ? t.nowPublic : t.nowPrivate;

    return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
};
