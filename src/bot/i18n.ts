const NBSP = ' ';

const plural = (count: number, one: string, other: string) => (count === 1 ? one : other);
const frenchPlural = (count: number, one: string, other: string) => (count <= 1 ? one : other);

export const en = {
    randomGif: {
        description: 'Replies with a random GIF',
        searchOption: 'What kind of GIF are you looking for?',
        localeOption: 'Set the region for GIF search (e.g., US, FR, JP)',
        limitOption: 'How many GIFs to pick from (1-50)',
        limitRange: 'The limit must be a number between 1 and 50.',
        noGif: 'Could not find a GIF for that word. Try another one.',
        reroll: 'Reroll',
        rerollGone: 'This GIF can no longer be rerolled.',
        rerollForbidden: 'Only the person who asked for this GIF can reroll it.',
    },
    revealWord: {
        name: 'Reveal word',
        notOurs: 'This is not a random-gif message.',
        unknown: 'No word found for this GIF (probably posted before history tracking).',
        private: 'The searcher keeps their words private.',
        searched: (user: string, word: string) => `${user} searched for **${word}**`,
        random: (user: string, word: string) => `${user} got a random **${word}**`,
    },
    history: {
        description: 'Show your recent random-gif history (last 10)',
        userOption: "Show another user's history (only if they made it public)",
        private: (name: string) => `${name} keeps their history private.`,
        emptySelf: 'You have no history yet. Try `/random-gif`.',
        empty: (name: string) => `${name} has no history yet.`,
        titleSelf: 'Your recent GIFs',
        title: (name: string) => `${name}'s recent GIFs`,
        searched: (word: string, locale: string, when: string) =>
            `Searched: **${word}** (${locale}), ${when}`,
        random: (word: string, locale: string, when: string) =>
            `Random: **${word}** (${locale}), ${when}`,
    },
    stats: {
        description: 'Show your random-gif stats',
        userOption: "Show another user's stats (only if they made it public)",
        private: (name: string) => `${name} keeps their stats private.`,
        emptySelf: 'You have no stats yet. Try `/random-gif`.',
        empty: (name: string) => `${name} has no stats yet.`,
        titleSelf: 'Your stats',
        title: (name: string) => `${name}'s stats`,
        total: 'Total GIFs',
        searched: 'Searched',
        random: 'Random',
        topWord: 'Most searched word',
        topWordValue: (word: string, count: number) =>
            `**${word}** (${count} ${plural(count, 'time', 'times')})`,
    },
    privacy: {
        description: 'Control who can see your random-gif history and stats',
        visibilityOption: 'public: others can view. private: only you (default)',
        publicChoice: 'public',
        privateChoice: 'private',
        alreadyPublic: 'Your history and stats are already **public**.',
        alreadyPrivate: 'Your history and stats are already **private**.',
        nowPublic: 'Your history and stats are now **public**. Others can view them.',
        nowPrivate: 'Your history and stats are now **private**. Only you can view them.',
    },
    forgetMe: {
        description: 'Delete all your random-gif data (history, preferences and game scores)',
        nothing: 'Nothing to forget: you had no data stored.',
        done: (history: number, preferences: number, games: number) =>
            `Deleted **${history}** history ${plural(history, 'entry', 'entries')}, **${preferences}** ${plural(preferences, 'preference', 'preferences')} and **${games}** game ${plural(games, 'record', 'records')}. You are forgotten.`,
    },
    guess: {
        description: 'Play the guess-the-word game',
        playDescription: 'Post a GIF and let everyone guess the word behind it',
        leaderboardDescription: 'Show the best players of this server',
        prompt: 'Guess the word',
        wordLine: (mask: string, length: number) =>
            `\`${mask}\` (${length} ${plural(length, 'letter', 'letters')})`,
        guessButton: 'Guess',
        hintButton: 'Hint',
        giveUpButton: 'Give up',
        modalTitle: 'Guess the word',
        modalLabel: 'Your answer',
        wrong: 'That is not the word. Try again.',
        over: 'This game is over.',
        giveUpForbidden: 'Only the person who started this game can give up.',
        won: (user: string, word: string) => `${user} found the word: **${word}**`,
        wonPoints: (user: string, word: string, points: number) =>
            `${user} found the word: **${word}** (+${points} ${plural(points, 'point', 'points')})`,
        gaveUp: (word: string) => `Nobody found it. The word was **${word}**.`,
        noGif: 'Could not get a GIF right now. Try again in a moment.',
        serverOnly: 'The leaderboard only exists in a server.',
        leaderboardTitle: 'Best players',
        leaderboardEmpty: 'Nobody has won a game on this server yet. Try `/guess play`.',
        leaderboardLine: (rank: number, user: string, points: number, wins: number) =>
            `${rank}. ${user}: ${points} ${plural(points, 'point', 'points')} (${wins} ${plural(wins, 'win', 'wins')})`,
    },
};

export type Messages = typeof en;

export const fr: Messages = {
    randomGif: {
        description: 'Répond avec un GIF au hasard',
        searchOption: `Quel genre de GIF cherches-tu${NBSP}?`,
        localeOption: 'Région de la recherche (par exemple US, FR, JP)',
        limitOption: 'Nombre de GIF parmi lesquels choisir (1 à 50)',
        limitRange: 'La limite doit être un nombre entre 1 et 50.',
        noGif: 'Aucun GIF trouvé pour ce mot. Essaie-en un autre.',
        reroll: 'Relancer',
        rerollGone: 'Ce GIF ne peut plus être relancé.',
        rerollForbidden: 'Seule la personne qui a demandé ce GIF peut le relancer.',
    },
    revealWord: {
        name: 'Révéler le mot',
        notOurs: 'Ce message ne vient pas de random-gif.',
        unknown: 'Aucun mot trouvé pour ce GIF (sans doute envoyé avant la mise en place de l’historique).',
        private: 'La personne qui a lancé la recherche garde ses mots privés.',
        searched: (user, word) => `${user} a cherché **${word}**`,
        random: (user, word) => `${user} a obtenu au hasard **${word}**`,
    },
    history: {
        description: 'Affiche ton historique random-gif récent (les 10 derniers)',
        userOption: 'Affiche l’historique d’une autre personne (seulement s’il est public)',
        private: (name) => `${name} garde son historique privé.`,
        emptySelf: 'Tu n’as pas encore d’historique. Essaie `/random-gif`.',
        empty: (name) => `${name} n’a pas encore d’historique.`,
        titleSelf: 'Tes GIF récents',
        title: (name) => `GIF récents de ${name}`,
        searched: (word, locale, when) => `Recherche${NBSP}: **${word}** (${locale}), ${when}`,
        random: (word, locale, when) => `Au hasard${NBSP}: **${word}** (${locale}), ${when}`,
    },
    stats: {
        description: 'Affiche tes statistiques random-gif',
        userOption: 'Affiche les statistiques d’une autre personne (seulement si elles sont publiques)',
        private: (name) => `${name} garde ses statistiques privées.`,
        emptySelf: 'Tu n’as pas encore de statistiques. Essaie `/random-gif`.',
        empty: (name) => `${name} n’a pas encore de statistiques.`,
        titleSelf: 'Tes statistiques',
        title: (name) => `Statistiques de ${name}`,
        total: 'Total de GIF',
        searched: 'Recherchés',
        random: 'Au hasard',
        topWord: 'Mot le plus cherché',
        topWordValue: (word, count) => `**${word}** (${count}${NBSP}fois)`,
    },
    privacy: {
        description: 'Choisis qui peut voir ton historique et tes statistiques random-gif',
        visibilityOption: `public${NBSP}: visible par les autres. privé${NBSP}: par toi uniquement (par défaut)`,
        publicChoice: 'public',
        privateChoice: 'privé',
        alreadyPublic: 'Ton historique et tes statistiques sont déjà **publics**.',
        alreadyPrivate: 'Ton historique et tes statistiques sont déjà **privés**.',
        nowPublic: 'Ton historique et tes statistiques sont maintenant **publics**. Les autres peuvent les voir.',
        nowPrivate: 'Ton historique et tes statistiques sont maintenant **privés**. Personne d’autre ne peut les voir.',
    },
    forgetMe: {
        description: 'Supprime toutes tes données random-gif (historique, préférences et scores)',
        nothing: `Rien à oublier${NBSP}: aucune donnée enregistrée.`,
        done: (history, preferences, games) =>
            `Supprimé${NBSP}: **${history}** ${frenchPlural(history, 'entrée', 'entrées')} d’historique, **${preferences}** ${frenchPlural(preferences, 'préférence', 'préférences')} et **${games}** ${frenchPlural(games, 'donnée', 'données')} de jeu. Tes données sont oubliées.`,
    },
    guess: {
        description: 'Joue à deviner le mot',
        playDescription: 'Poste un GIF et fais deviner le mot qui se cache derrière',
        leaderboardDescription: 'Affiche les meilleurs joueurs et joueuses du serveur',
        prompt: 'Devine le mot (en anglais)',
        wordLine: (mask, length) =>
            `\`${mask}\` (${length}${NBSP}${frenchPlural(length, 'lettre', 'lettres')})`,
        guessButton: 'Deviner',
        hintButton: 'Indice',
        giveUpButton: 'Abandonner',
        modalTitle: 'Devine le mot (en anglais)',
        modalLabel: 'Ta réponse',
        wrong: 'Ce n’est pas le bon mot. Réessaie.',
        over: 'Cette partie est terminée.',
        giveUpForbidden: 'Seule la personne qui a lancé la partie peut abandonner.',
        won: (user, word) => `${user} a trouvé le mot${NBSP}: **${word}**`,
        wonPoints: (user, word, points) =>
            `${user} a trouvé le mot${NBSP}: **${word}** (+${points}${NBSP}${frenchPlural(points, 'point', 'points')})`,
        gaveUp: (word) => `Personne n’a trouvé. Le mot était **${word}**.`,
        noGif: 'Impossible d’obtenir un GIF pour le moment. Réessaie dans un instant.',
        serverOnly: 'Le classement n’existe que sur un serveur.',
        leaderboardTitle: 'Meilleurs scores',
        leaderboardEmpty: 'Personne n’a encore gagné sur ce serveur. Essaie `/guess play`.',
        leaderboardLine: (rank, user, points, wins) =>
            `${rank}. ${user}${NBSP}: ${points}${NBSP}${frenchPlural(points, 'point', 'points')} (${wins}${NBSP}${frenchPlural(wins, 'victoire', 'victoires')})`,
    },
};

export const messagesFor = (locale: string): Messages => (locale.startsWith('fr') ? fr : en);
