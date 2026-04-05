export const settingsPage = {
  title: 'Einstellungen',
  description: 'Passe Erscheinungsbild, Datumsverhalten, Hotkey-Sichtbarkeit und Profilsteuerung an einer Stelle an.',
  saveState: 'Einstellungen werden automatisch gespeichert',
  tabs: {
    appearance: 'Darstellung',
    dates: 'Datum',
    workflow: 'Arbeitsfluss',
  },
  roles: {
    admin: 'Admin',
    manager: 'Manager',
    user: 'Benutzer',
  },
  rbac: {
    title: 'Rollenbasierter Zugriff',
    description: 'Die Autorisierung nutzt jetzt eine Better-Auth-Zugriffsmatrix statt einzelner Rollenabfragen.',
    allowed: 'Erlaubt',
    denied: 'Nicht erlaubt',
    permissions: {
      viewReports: 'Berichte ansehen',
      manageUsers: 'Benutzer verwalten',
      adminWorkspace: 'Admin-Bereich öffnen',
      systemSettings: 'Systemeinstellungen verwalten',
    },
  },
  appearance: {
    title: 'Darstellungsoptionen',
    description: 'Passe die visuelle Stimmung und die Dichte der Oberfläche an.',
    compactSpacing: 'Kompakte Abstände',
    compactSpacingDescription: 'Verringert Innenabstände und verdichtet das Layout im Hauptbereich.',
    reducedMotion: 'Weniger Bewegung',
    reducedMotionDescription: 'Reduziert nicht notwendige Animationen und Bewegungen.',
    backgrounds: {
      paper: {
        title: 'Papier',
        description: 'Neutrale Fläche mit sanftem Kontrast.',
      },
      aurora: {
        title: 'Aurora',
        description: 'Kühle Cyan- und Grüntöne.',
      },
      dusk: {
        title: 'Abend',
        description: 'Wärmere Farben mit mehr Tiefe.',
      },
      forest: {
        title: 'Wald',
        description: 'Gedämpfte Grüntöne für ruhigere Ansichten.',
      },
    },
  },
  dates: {
    title: 'Datums- und Kalenderverhalten',
    description: 'Lege fest, wie Daten formatiert und Kalender dargestellt werden.',
    formatLabel: 'Datumsformat',
    weekStartsLabel: 'Wochenbeginn',
    showOutsideDays: 'Außerhalb liegende Tage anzeigen',
    showOutsideDaysDescription: 'Zeigt auslaufende Tage des vorherigen und nächsten Monats im Kalender an.',
    previewLabel: 'Vorschau',
    formats: {
      localized: 'Lokales Mittelformat',
      long: 'Langes Format mit Wochentag',
      iso: 'ISO 8601',
    },
    weekStarts: {
      monday: 'Montag',
      sunday: 'Sonntag',
    },
  },
  workflow: {
    title: 'Arbeitsfluss und Navigation',
    description: 'Bestimme, wie viele Navigationshilfen die Anwendung anzeigen soll.',
    hotkeyHints: 'Hotkey-Hinweise anzeigen',
    hotkeyHintsDescription: 'Zeigt den Hotkey-Launcher und Inline-Kürzel in der Navigation an.',
    hotkeySummary:
      'Nutze `Alt` plus einen Buchstaben zum Seitenwechsel oder drücke `?`, um die vollständige Kürzelliste zu öffnen.',
  },
  profilePictureTitle: 'Profilbild',
  profilePictureDescription: 'Lade ein neues Profilbild hoch oder entferne dein aktuelles Bild.',
  form: {
    chooseImage: 'Profilbild auswählen',
    hint: 'Verwende für beste Ergebnisse ein quadratisches PNG- oder JPEG-Bild.',
    upload: 'Bild hochladen',
    uploading: 'Wird hochgeladen…',
    remove: 'Bild entfernen',
    success: 'Profilbild aktualisiert.',
    empty: 'Kein Bild',
    alt: 'Profilbild',
  },
};
