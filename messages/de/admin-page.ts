export const adminPage = {
  accessBadge: 'Nur ADMIN',
  navigation: {
    overview: 'Übersicht',
    reports: 'Berichte',
    users: 'Benutzer',
    systemSettings: 'Systemeinstellungen',
    dataStudio: 'Data Studio',
  },
  overview: {
    title: 'Admin-Übersicht',
    description:
      'Nutze diese Bereiche für privilegierte Berichte, Benutzeroperationen, Plattform-Konfiguration und schema-gesteuerte Werkzeuge.',
    openWorkspace: 'Bereich öffnen',
  },
  reports: {
    title: 'Berichte',
    description: 'Prüfe Plattformzustand, Sicherheitslage und Nutzungssignale an einer Stelle.',
    ready: 'Zur Prüfung bereit',
    columns: {
      report: 'Bericht',
      owner: 'Verantwortlich',
      cadence: 'Rhythmus',
      status: 'Status',
      actions: 'Aktionen',
    },
    actions: {
      open: 'Öffnen',
      export: 'Exportieren',
    },
    metrics: {
      coverage: {
        label: 'Autorisierungsabdeckung',
        value: '100%',
        detail: 'Alle privilegierten Admin-Routen verlangen jetzt die Rolle ADMIN.',
      },
      auditTrail: {
        label: 'Audit-Fenster',
        value: '24h',
        detail: 'Sicherheitsrelevante Aktivitäten lassen sich nach Änderungen oder Vorfällen schnell prüfen.',
      },
      refreshCadence: {
        label: 'Aktualisierungsrhythmus',
        value: '5 Min',
        detail: 'Betriebliche Zusammenfassungen werden häufig für schnelle Entscheidungen vorbereitet.',
      },
    },
    catalogTitle: 'Berichtskatalog',
    catalogDescription: 'Jeder Bericht unten hat einen klaren Owner, einen Aktualisierungsrhythmus und einen nächsten Schritt.',
    catalog: {
      securityAccess: {
        title: 'Sicherheits- und Zugriffsprüfung',
        description: 'Verfolge Rollenänderungen, aktuelle Ablehnungen und Anomalien bei Anmeldungen.',
        owner: 'Security Operations',
        cadence: 'Alle 4 Stunden',
      },
      auditActivity: {
        title: 'Audit-Aktivitätslog',
        description: 'Prüfe Admin-Aktionen, Kontoänderungen und risikoreiche Endpunkte in einem Feed.',
        owner: 'Platform-Team',
        cadence: 'Live-Feed',
      },
      workspaceAdoption: {
        title: 'Workspace-Nutzung',
        description: 'Miss aktive Teams, wiederkehrende Besuche und Abbrüche in Admin-Bereichen.',
        owner: 'Operations',
        cadence: 'Täglich um 06:00',
      },
      schemaHealth: {
        title: 'Schema-Zustand',
        description: 'Prüfe Validierungsfehler, Ingestions-Abweichungen und Integritätsprobleme bei Writes.',
        owner: 'Data Engineering',
        cadence: 'Bei jedem Deployment',
      },
    },
    alertsTitle: 'Geplante Alerts',
    alertsDescription: 'Admins können die wichtigsten Berichtsergebnisse direkt an die richtigen Empfänger verteilen.',
    alerts: {
      dailyDigest: {
        title: 'Täglicher Admin-Digest',
        description: 'Sendet aktuelle Plattform- und Sicherheitszusammenfassungen an die Admin-Rotation.',
        channel: 'E-Mail',
      },
      weeklyExecutive: {
        title: 'Wöchentlicher Executive-Snapshot',
        description: 'Bündelt Nutzung, Risiko und operative Highlights für die Leitungsebene.',
        channel: 'PDF',
      },
      failedIngestion: {
        title: 'Warnung bei fehlgeschlagener Ingestion',
        description: 'Eskaliert Schema- oder Write-Fehler sofort, sobald der Schwellwert überschritten wird.',
        channel: 'Slack',
      },
    },
  },
  users: {
    title: 'Benutzerverwaltung',
    description: 'Behalte Rollenverteilung und die operativen Abläufe im Blick, die Admins bei Zugriffsänderungen brauchen.',
    metrics: {
      privileged: {
        label: 'Privilegierte Benutzer',
        value: '6',
        detail: 'Konten mit direktem Zugriff auf Admin-Bereiche und Freigaben.',
      },
      operational: {
        label: 'Manager',
        value: '18',
        detail: 'Operative Nutzer, die Teams koordinieren, ohne volle Admin-Rechte zu haben.',
      },
      member: {
        label: 'Mitglieder',
        value: '124',
        detail: 'Standardnutzer, die aktuell reguläre Produktabläufe ausführen.',
      },
    },
    tableTitle: 'Benutzerverzeichnis',
    tableDescription: 'Nutze die Benutzerliste, um Zugriff zu prüfen, offene Einladungen zu sehen und direkt zu handeln.',
    columns: {
      user: 'Benutzer',
      role: 'Rolle',
      status: 'Status',
      lastSeen: 'Letzte Aktivität',
      actions: 'Verwalten',
    },
    status: {
      active: 'Aktiv',
      pending: 'Einladung offen',
      suspended: 'Gesperrt',
    },
    actions: {
      active: {
        primary: 'Rolle ändern',
        secondary: 'Passwort zurücksetzen',
        danger: 'Sperren',
      },
      pending: {
        primary: 'Einladung erneut senden',
        secondary: 'Rolle anpassen',
      },
      suspended: {
        primary: 'Zugriff wiederherstellen',
        secondary: 'Logs prüfen',
      },
    },
    workflowTitle: 'Admin-Abläufe',
    workflowDescription: 'Typische Benutzerverwaltungsaktionen, die bei Administratoren bleiben sollten.',
    workflows: {
      invite: {
        title: 'Einladen',
        description: 'Mitarbeitende mit der passenden Startrolle und dem richtigen Zugriff onboarden.',
      },
      promote: {
        title: 'Hochstufen',
        description: 'Vertrauenswürdige Operatoren erst nach Rollen- und Risiko-Prüfung erhöhen.',
      },
      suspend: {
        title: 'Sperren',
        description: 'Zugriff sofort pausieren, wenn ein Konto geprüft oder archiviert werden muss.',
      },
    },
  },
  systemSettings: {
    title: 'Systemeinstellungen',
    description: 'Steuere plattformweite Richtlinien, die in Admin-Hände gehören und nicht in persönliche Präferenzen.',
    actions: {
      edit: 'Bearbeiten',
      audit: 'Audit-Log',
    },
    groups: {
      sessions: {
        title: 'Sitzungskontrollen',
        description: 'Definiere Sitzungsdauer, Rotationsrhythmus und Zeitfenster für erneute Anmeldung.',
      },
      notifications: {
        title: 'Benachrichtigungs-Standards',
        description: 'Lege Digest-Rhythmus, Eskalationswege und Admin-Broadcasts fest.',
      },
      storage: {
        title: 'Speicher und Aufbewahrung',
        description: 'Prüfe Upload-Limits, lokale Assets und Bereinigungsfenster.',
      },
    },
    settings: {
      sessionLifetime: {
        label: 'Sitzungsdauer',
        value: '8 Stunden mit erzwungener Token-Rotation bei privilegierten Aktionen.',
        scope: 'Authentifizierung',
      },
      idleTimeout: {
        label: 'Inaktivitäts-Timeout',
        value: '20 Minuten bis zum automatischen Logout auf Admin-Routen.',
        scope: 'Sicherheit',
      },
      mfaPolicy: {
        label: 'MFA-Richtlinie',
        value: 'Pflicht für ADMIN-Konten und optional für alle anderen.',
        scope: 'Zugriff',
      },
      digestCadence: {
        label: 'Digest-Rhythmus',
        value: 'Zwei tägliche Zusammenfassungen für Admin-Benachrichtigungen und Berichtsdigests.',
        scope: 'Kommunikation',
      },
      incidentRouting: {
        label: 'Incident-Routing',
        value: 'Kritische Vorfälle gehen an den Security-Kanal und den On-Call-Alias.',
        scope: 'Eskalation',
      },
      maintenanceWindow: {
        label: 'Wartungshinweis',
        value: 'Änderungen werden 72 Stunden vor geplanter Downtime angekündigt.',
        scope: 'Betrieb',
      },
      uploadLimit: {
        label: 'Upload-Limit',
        value: '25 MB pro Asset mit Bildvalidierung vor dem Speichern.',
        scope: 'Storage',
      },
      retentionWindow: {
        label: 'Aufbewahrungsfenster',
        value: '365 Tage für Logs, Uploads und wiederherstellbare Admin-Datensätze.',
        scope: 'Compliance',
      },
      auditExports: {
        label: 'Audit-Exporte',
        value: 'Nächtlicher Archiv-Export in den Reporting-Storage-Bucket.',
        scope: 'Backups',
      },
    },
    checklistTitle: 'Änderungs-Checkliste',
    checklistDescription: 'Nutze dasselbe Prüfverfahren, wenn plattformweite Einstellungen geändert werden.',
    checklist: {
      review: 'Prüfe die operative Auswirkung, bevor du eine plattformweite Änderung vornimmst.',
      announce: 'Kommuniziere Änderungen frühzeitig an betroffene Teams, wenn sich Verhalten ändert.',
      verify: 'Prüfe nach dem Rollout Audit-Logs, Fehlerraten und Auswirkungen auf Nutzer.',
    },
  },
  dataStudio: {
    title: 'Data Studio',
    description: 'Erstelle Datensätze über schema-gesteuerte Formulare aus db-schema.json. Der Zugriff ist auf ADMIN beschränkt.',
    summary: {
      tables: 'Schreibbare Tabellen',
      fields: 'Verfügbare Felder',
      required: 'Pflichtfelder in der gewählten Tabelle',
    },
    explorerTitle: 'Schema-Explorer',
    explorerDescription: 'Wähle eine Tabelle aus, prüfe ihre Struktur und erstelle dann einen Datensatz über das generierte Formular.',
    emptyState: 'Keine Tabelle ausgewählt',
    noDescription: 'Für diese Tabelle ist keine Beschreibung hinterlegt.',
    details: {
      tableName: 'Tabellenname',
      fieldCount: 'Anzahl Felder',
      endpoint: 'Write-Endpunkt',
    },
    formTitle: 'Generiertes Formular',
    formDescription: 'Sende das generierte Formular ab, um einen Datensatz in der ausgewählten Tabelle zu erstellen.',
    fieldListTitle: 'Feldübersicht',
    fieldType: 'Feldtyp',
    fieldRequired: 'Pflicht',
    fieldOptional: 'Optional',
    guideTitle: 'Studio-Leitfaden',
    guideDescription:
      'Wähle eine Tabelle, fülle die Pflichtfelder aus und sende das generierte Formular ab, um einen neuen Datensatz über die Admin-API zu schreiben.',
  },
};
