export const notificationsPage = {
  fallbackUser: 'dir',
  badge: 'Updates nach Anmeldung',
  title: 'Benachrichtigungen',
  description:
    'Ein einfaches Postfach fuer {name}. Behalte Sicherheitsereignisse, Arbeitsbereich-Updates und geplante Digests im Blick.',
  summary: {
    unread: {
      label: 'Ungelesen',
      value: '3',
      hint: 'Alles Neue seit deiner letzten Sitzung wird hier gebuendelt angezeigt.',
    },
    today: {
      label: 'Heute',
      value: '2',
      hint: 'Aktuelle Aktivitaeten aus deinem Konto und Arbeitsbereich der letzten Stunden.',
    },
    preferences: {
      label: 'Zustellung',
      value: 'E-Mail + In-App',
      hint: 'In den Einstellungen wechselst du zwischen Sofortmeldungen und ruhigeren Digests.',
    },
  },
  feed: {
    title: 'Letzte Aktivitaeten',
    description: 'Diese Beispielmeldungen zeigen, welche Updates angemeldete Nutzer sehen koennen.',
    items: {
      security: {
        statusKey: 'unread',
        status: 'Ungelesen',
        time: 'Vor 2 Min.',
        title: 'Neue Anmeldung erkannt',
        body: 'Auf dein Konto wurde ueber eine neue Browser-Sitzung zugegriffen. Wenn du das warst, ist keine Aktion noetig.',
      },
      workspace: {
        statusKey: 'upcoming',
        status: 'Geplant',
        time: 'Heute um 16:00',
        title: 'Arbeitsbereich-Aenderungen geplant',
        body: 'Ein kleines Paket aus Inhalten und Formular-Updates steht fuer die Veroeffentlichung im gemeinsamen Arbeitsbereich bereit.',
      },
      digest: {
        statusKey: 'read',
        status: 'Gelesen',
        time: 'Gestern',
        title: 'Wochenuebersicht versendet',
        body: 'Dein letzter Digest wurde mit Profil-Aenderungen, Uploads und aktuellen Kommunikations-Highlights verschickt.',
      },
    },
  },
  actions: {
    title: 'Schnellzugriffe',
    description: 'Springe direkt zu den Bereichen, die am haeufigsten mit Kontobenachrichtigungen verknuepft sind.',
    profile: 'Profil oeffnen',
    settings: 'Benachrichtigungen',
  },
  preferences: {
    title: 'Zustelloptionen',
    description:
      'Diese Seite dient als leichtgewichtiges Benachrichtigungszentrum, waehrend die vollstaendigen Optionen in den Einstellungen liegen.',
    email: 'E-Mail-Benachrichtigungen bleiben fuer Sicherheit und Kontowiederherstellung aktiv.',
    push: 'In-App-Hinweise eignen sich fuer Aktivitaeten im Arbeitsbereich, die keine sofortige Reaktion brauchen.',
    digest: 'Woechentliche Digests reduzieren Laerm und fassen dennoch relevante Aenderungen zusammen.',
  },
};
