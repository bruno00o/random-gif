import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import {
    createGame,
    getGame,
    getLeaderboard,
    giveUpGame,
    revealLetter,
    winGame,
    type GuessGame,
} from '../../../db/guess.js';
import { fetchGif } from '../../fetchGif.js';
import { en, fr, messagesFor, type Messages } from '../../i18n.js';

const ANSWER_INPUT = 'word';

export const data = new SlashCommandBuilder()
    .setName('guess')
    .setDescription(en.guess.description)
    .setDescriptionLocalizations({ fr: fr.guess.description })
    .addSubcommand((subcommand) =>
        subcommand
            .setName('play')
            .setDescription(en.guess.playDescription)
            .setDescriptionLocalizations({ fr: fr.guess.playDescription }),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('leaderboard')
            .setDescription(en.guess.leaderboardDescription)
            .setDescriptionLocalizations({ fr: fr.guess.leaderboardDescription }),
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

export const normalizeWord = (word: string): string =>
    word
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .trim();

export const maskWord = (word: string, revealed: number): string =>
    [...word].map((letter, index) => (index < revealed ? letter : '_')).join(' ');

export const pointsFor = (revealed: number): number => Math.max(1, 3 - revealed);

const buttonsRow = (t: Messages['guess'], word: string, revealed: number) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`${data.name}:answer`)
            .setLabel(t.guessButton)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`${data.name}:hint`)
            .setLabel(t.hintButton)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(revealed >= word.length - 1),
        new ButtonBuilder()
            .setCustomId(`${data.name}:give-up`)
            .setLabel(t.giveUpButton)
            .setStyle(ButtonStyle.Secondary),
    );

const openEmbed = (t: Messages['guess'], word: string, gifUrl: string, revealed: number) =>
    new EmbedBuilder()
        .setTitle(t.prompt)
        .setDescription(t.wordLine(maskWord(word, revealed), word.length))
        .setImage(gifUrl)
        .setColor(0x5865f2);

const closedEmbed = (t: Messages['guess'], gifUrl: string, description: string) =>
    new EmbedBuilder().setTitle(t.prompt).setDescription(description).setImage(gifUrl).setColor(0x5865f2);

const play = async (interaction: ChatInputCommandInteraction, t: Messages['guess']) => {
    await interaction.deferReply();

    const gif = await fetchGif(null, null, null);
    if (!gif) {
        await interaction.deleteReply();
        return interaction.followUp({ content: t.noGif, flags: MessageFlags.Ephemeral });
    }

    const message = await interaction.editReply({
        embeds: [openEmbed(t, gif.word, gif.gif, 0)],
        components: [buttonsRow(t, gif.word, 0)],
    });

    const { db } = interaction.client as BotClient;
    createGame(db, {
        message_id: message.id,
        word: gif.word,
        user_id: interaction.user.id,
        guild_id: interaction.guildId,
        gif_url: gif.gif,
    });
};

const leaderboard = (interaction: ChatInputCommandInteraction, t: Messages['guess']) => {
    if (!interaction.guildId) {
        return interaction.reply({ content: t.serverOnly, flags: MessageFlags.Ephemeral });
    }

    const { db } = interaction.client as BotClient;
    const entries = getLeaderboard(db, interaction.guildId);

    if (entries.length === 0) {
        return interaction.reply({ content: t.leaderboardEmpty, flags: MessageFlags.Ephemeral });
    }

    const lines = entries.map((entry, index) =>
        t.leaderboardLine(index + 1, `<@${entry.user_id}>`, entry.points, entry.wins),
    );
    const embed = new EmbedBuilder()
        .setTitle(t.leaderboardTitle)
        .setDescription(lines.join('\n'))
        .setColor(0x5865f2);

    return interaction.reply({ embeds: [embed] });
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const t = messagesFor(interaction.locale).guess;
    return interaction.options.getSubcommand() === 'leaderboard'
        ? leaderboard(interaction, t)
        : play(interaction, t);
};

const answerModal = (t: Messages['guess']) =>
    new ModalBuilder()
        .setCustomId(`${data.name}:answer`)
        .setTitle(t.modalTitle)
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId(ANSWER_INPUT)
                    .setLabel(t.modalLabel)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100),
            ),
        );

const openGame = (client: BotClient, messageId: string): GuessGame | null => {
    const game = getGame(client.db, messageId);
    return game?.status === 'open' ? game : null;
};

export const handleButton = async (interaction: ButtonInteraction) => {
    const client = interaction.client as BotClient;
    const t = messagesFor(interaction.locale).guess;
    const game = openGame(client, interaction.message.id);

    if (!game) {
        return interaction.reply({ content: t.over, flags: MessageFlags.Ephemeral });
    }

    const [, action] = interaction.customId.split(':');

    if (action === 'answer') return interaction.showModal(answerModal(t));

    if (action === 'hint') {
        revealLetter(client.db, game.message_id);
        const revealed = getGame(client.db, game.message_id)?.revealed ?? game.revealed;
        return interaction.update({
            embeds: [openEmbed(t, game.word, game.gif_url, revealed)],
            components: [buttonsRow(t, game.word, revealed)],
        });
    }

    if (game.user_id !== interaction.user.id) {
        return interaction.reply({ content: t.giveUpForbidden, flags: MessageFlags.Ephemeral });
    }

    if (!giveUpGame(client.db, game.message_id)) {
        return interaction.reply({ content: t.over, flags: MessageFlags.Ephemeral });
    }

    return interaction.update({
        embeds: [closedEmbed(t, game.gif_url, t.gaveUp(game.word))],
        components: [],
    });
};

export const handleModal = async (interaction: ModalSubmitInteraction) => {
    if (!interaction.isFromMessage()) return;

    const client = interaction.client as BotClient;
    const t = messagesFor(interaction.locale).guess;
    const game = openGame(client, interaction.message.id);

    if (!game) {
        return interaction.reply({ content: t.over, flags: MessageFlags.Ephemeral });
    }

    const answer = interaction.fields.getTextInputValue(ANSWER_INPUT);
    if (normalizeWord(answer) !== normalizeWord(game.word)) {
        return interaction.reply({ content: t.wrong, flags: MessageFlags.Ephemeral });
    }

    const points = pointsFor(game.revealed);
    if (!winGame(client.db, game, interaction.user.id, points)) {
        return interaction.reply({ content: t.over, flags: MessageFlags.Ephemeral });
    }

    const winner = `<@${interaction.user.id}>`;
    const description = game.guild_id
        ? t.wonPoints(winner, game.word, points)
        : t.won(winner, game.word);

    return interaction.update({
        embeds: [closedEmbed(t, game.gif_url, description)],
        components: [],
    });
};
