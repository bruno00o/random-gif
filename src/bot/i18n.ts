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
        description: 'Delete all your random-gif data (history and privacy preferences)',
        nothing: 'Nothing to forget: you had no data stored.',
        done: (history: number, preferences: number) =>
            `Deleted **${history}** history ${plural(history, 'entry', 'entries')} and **${preferences}** ${plural(preferences, 'preference', 'preferences')}. You are forgotten.`,
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
        description: 'Supprime toutes tes données random-gif (historique et préférences)',
        nothing: `Rien à oublier${NBSP}: aucune donnée enregistrée.`,
        done: (history, preferences) =>
            `Supprimé${NBSP}: **${history}** ${frenchPlural(history, 'entrée', 'entrées')} d’historique et **${preferences}** ${frenchPlural(preferences, 'préférence', 'préférences')}. Tes données sont oubliées.`,
    },
};

export const messagesFor = (locale: string): Messages => (locale.startsWith('fr') ? fr : en);
