export const profilePage = {
  title: 'Profil',
  description: 'Sieh dein Profil so, wie andere Personen es sehen.',
  view: {
    title: 'Profil',
    description: 'Sieh dir dieses Profil an und folge der Person bei Bedarf.',
    followers: 'Follower',
    followingCount: 'Folgt',
    friends: 'Freunde',
    addFriend: 'Freund hinzufügen',
    follow: 'Folgen',
    unfollow: 'Nicht mehr folgen',
    following: 'Wird gefolgt…',
    unfollowing: 'Wird entfolgt…',
    block: 'Blockieren',
    unblock: 'Entblockieren',
    blocking: 'Wird blockiert…',
    unblocking: 'Wird entblockiert…',
    blockedDescription:
      'Du hast dieses Profil blockiert. Diese Person kann dir nicht mehr folgen oder in deiner Suche erscheinen.',
    editProfile: 'Profil bearbeiten',
    error:
      'Diese Benutzerbeziehung konnte gerade nicht aktualisiert werden. Bitte versuche es erneut.',
  },
  followersPage: {
    title: 'Follower',
    description: '{name} hat {count} Follower.',
    backToProfile: 'Zurück zum Profil',
    summary: '{visibleCount} von {totalCount} Followern werden angezeigt.',
    hiddenSummary: '{count} Follower sind durch Sichtbarkeitsrechte verborgen.',
    empty: 'Dieses Profil hat noch keine Follower.',
    hiddenEmpty:
      'Es gibt Follower, aber ihre Sichtbarkeitsrollen erlauben hier keine Anzeige.',
    roles: {
      PUBLIC: 'Öffentlich',
      MEMBERS: 'Mitglieder',
      PRIVATE: 'Privat',
    },
  },
  form: {
    displayName: {
      label: 'Anzeigename',
      placeholder: 'Dein Anzeigename',
      save: 'Namen speichern',
      saving: 'Wird gespeichert…',
      success: 'Anzeigename aktualisiert.',
    },
    tag: {
      label: 'Öffentlicher Tag',
      placeholder: 'dein-tag',
      hint: 'Deine öffentliche Profil-URL wird sofort aktualisiert:',
      save: 'Tag speichern',
      saving: 'Wird gespeichert…',
      success: 'Öffentlicher Tag aktualisiert.',
      viewProfile: 'Öffentliches Profil ansehen',
    },
  },
};
