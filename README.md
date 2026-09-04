# 🎫 Discord Ticket Bot

Ein vollständiger, produktionsreifer Discord Ticket Bot mit modernem GUI, Transcript-Funktion und umfangreicher Fehlerbehandlung.

## 📋 Features

- ✅ **Modernes Ticket-Panel** mit 5 verschiedenen Tickettypen
  - 🌾 Farmauftrag
  - 🧱 Bauauftrag
  - 📋 Auftrag
  - 📝 Bewerbung
  - 📦 Lager

- ✅ **Vollständiges Ticket-Management**
  - Private Ticket-Channels
  - Automatische Berechtigungsverwaltung
  - Claim-Funktion für Support-Staff
  - User hinzufügen/entfernen
  - Automatische Transcripts beim Schließen

- ✅ **Logging & Monitoring**
  - Log-Channel für alle Aktionen
  - Detaillierte Audit-Logs
  - Transcripts als Datei-Download

- ✅ **Fehlerbehandlung**
  - Umfangreiche Try-Catch Blöcke
  - Aussagekräftige Fehlermeldungen
  - Fallback-Mechanismen

- ✅ **Berechtigungssystem**
  - Rollenbasierte Kontrolle
  - Support-Rolle mit erweiterten Rechten
  - Channel-spezifische Overrides

## 🚀 Installation

### 1. Node.js und npm installieren
Stelle sicher, dass Node.js 18+ installiert ist:
```bash
node --version
npm --version
```

### 2. Projekt klonen und Dependencies installieren
```bash
cd dc-bot
npm install
```

### 3. Environment-Variablen konfigurieren

Kopiere die `.env.example` Datei:
```bash
cp .env.example .env
```

Öffne die `.env` Datei und trage deine Werte ein:
```env
DISCORD_TOKEN=dein_bot_token_hier
LOG_CHANNEL_ID=deine_log_channel_id
SUPPORT_ROLE_ID=deine_support_role_id
TICKET_CATEGORY_ID=deine_ticket_kategorie_id
```

## 🔑 Umgebungsvariablen erklärt

### DISCORD_TOKEN
**Was ist das?** Der Token des Discord Bots, mit dem er sich bei Discord authentifiziert.

**Wie bekommst du ihn?**
1. Gehe zu https://discord.com/developers/applications
2. Klicke auf "New Application" oder öffne eine existierende Application
3. Gehe zum Tab "Bot"
4. Unter "TOKEN" klickst du auf "Copy" um den Token zu kopieren
5. Paste den Token in die `.env` Datei

**Wichtig:** 
- Teile deinen Token niemals!
- Wenn du dich unsicher bist, dass der Token sicher ist, resetze ihn: Klick auf "Reset Token" im Bot-Tab

### LOG_CHANNEL_ID
**Was ist das?** Die ID des Discord-Channels, in dem der Bot alle Ticket-Aktionen protokolliert.

**Wie bekommst du sie?**
1. Aktiviere Developer Mode in Discord:
   - Einstellungen → Erweitert → Entwicklermodus (An)
2. Erstelle einen neuen privaten Channel (z.B. `#ticket-logs`)
3. Rechtsklick auf den Channel → "Channel-ID kopieren"
4. Paste die ID in die `.env` Datei

**Beispiel:** `LOG_CHANNEL_ID=1234567890123456789`

### SUPPORT_ROLE_ID
**Was ist das?** Die ID der Discord-Rolle, deren Mitglieder Support-Funktionen im Bot haben (können Tickets claimen, User verwalten, etc.).

**Wie bekommst du sie?**
1. Gehe zu Server-Einstellungen → Rollen
2. Erstelle eine neue Rolle (z.B. "Support Team") oder nutze eine existierende
3. Aktiviere Developer Mode (siehe oben)
4. Rechtsklick auf die Rolle in der Rollen-Liste → "Rollen-ID kopieren"
5. Paste die ID in die `.env` Datei

**Beispiel:** `SUPPORT_ROLE_ID=1234567890123456789`

**Wichtig:** Gib diese Rolle nur vertrauenswürdigen Mitgliedern!

### TICKET_CATEGORY_ID
**Was ist das?** Die ID der Discord-Kategorie, in der neu erstellte Ticket-Channels automatisch erstellt werden.

**Wie bekommst du sie?**
1. Gehe zu deinem Discord Server
2. Erstelle eine neue Kategorie (z.B. "🎫 Tickets")
3. Aktiviere Developer Mode (siehe oben)
4. Rechtsklick auf die Kategorie → "Kategorie-ID kopieren"
5. Paste die ID in die `.env` Datei

**Beispiel:** `TICKET_CATEGORY_ID=1234567890123456789`

## 🤖 Bot-Berechtigungen einrichten

Der Bot benötigt folgende Berechtigungen:

1. Gehe zu https://discord.com/developers/applications
2. Öffne deine Application
3. Gehe zu "OAuth2" → "URL Generator"
4. Wähle folgende Scopes:
   - `bot`
5. Wähle folgende Permissions:
   - Manage Channels
   - View Channels
   - Send Messages
   - Read Message History
   - Mention @everyone, @here, and @roles
   - Manage Messages
   - Manage Roles
   - Manage Permissions
6. Kopiere die generierte URL und öffne sie um den Bot deinem Server hinzuzufügen

## ▶️ Bot starten

### Normales Starten
```bash
npm start
```

### Mit automatischem Neustart bei Dateiänderungen (Development)
```bash
npm run dev
```

Der Bot wird dann mit folgendem Output starten:
```
✅ Bot ist online als TicketBot#1234
```

## 📖 Bot-Befehle und Features

### Setup-Befehl
Nur für Admins! Diesen Befehl einmal ausführen um das Ticket-Panel zu erstellen:

```
!ticket-setup
```

Dies erstellt das Willkommens-Panel mit allen Ticket-Optionen in dem Channel, in dem der Befehl ausgeführt wird.

### Ticket-Panel Buttons
Nachdem `!ticket-setup` ausgeführt wurde, erscheint ein Panel mit Buttons:

- 🌾 **Farmauftrag** - Erstellt ein Farmauftrag-Ticket
- 🧱 **Bauauftrag** - Erstellt ein Bauauftrag-Ticket
- 📋 **Auftrag** - Erstellt ein allgemeines Auftrag-Ticket
- 📝 **Bewerbung** - Erstellt ein Bewerbungs-Ticket
- 📦 **Lager** - Erstellt ein Lager-Ticket

### Ticket-Management Buttons

Innerhalb eines Tickets sind folgende Buttons verfügbar:

- **👤 Claim** - Support-Member können das Ticket "claimen" (zu ihrer Verantwortung übernehmen)
- **➕ User Hinzufügen** - Fügt einen User zum Ticket hinzu (via User-ID oder @mention)
- **➖ User Entfernen** - Entfernt einen User vom Ticket
- **🔒 Ticket Schließen** - Schließt das Ticket und erstellt ein Transcript

### Automatische Funktionen

- **Logging**: Alle Ticket-Aktionen werden im Log-Channel protokolliert
- **Transcripts**: Beim Schließen eines Tickets wird ein Transcript mit allen Nachrichten erstellt und an den Ticket-Creator gesendet
- **Berechtigungen**: Neue Tickets sind privat; nur der Creator und das Support-Team können sie sehen

## 📝 Beispiel .env Datei

```env
# Discord Bot Token
DISCORD_TOKEN=MzA4MjEyNTk1MjE5Mzk3Njk3.C-IxrQ.rCL4gvxD3PkG5x8mL9n2o3p4q

# Log Channel für Ticket-Aktionen
LOG_CHANNEL_ID=987654321098765432

# Support Rolle (für Claims, User-Management, etc.)
SUPPORT_ROLE_ID=876543210987654321

# Kategorie für Tickets
TICKET_CATEGORY_ID=765432109876543210
```

## 🛠️ Troubleshooting

### Bot ist offline
- ✅ Überprüfe, ob der DISCORD_TOKEN in der `.env` Datei korrekt ist
- ✅ Überprüfe, ob die `.env` Datei im selben Verzeichnis wie `main.js` liegt
- ✅ Versuche den Bot neu zu starten: `npm start`

### Bot kann Channels nicht erstellen
- ✅ Gib dem Bot die Berechtigung "Kanäle verwalten"
- ✅ Überprüfe, ob die TICKET_CATEGORY_ID korrekt ist
- ✅ Überprüfe, ob die Kategorie noch existiert

### Logs werden nicht angezeigt
- ✅ Überprüfe, ob die LOG_CHANNEL_ID korrekt ist
- ✅ Gib dem Bot die Berechtigung "Nachrichten senden" im Log-Channel
- ✅ Stelle sicher, dass der Bot den Channel sehen kann

### Tickets können nicht erstellt werden
- ✅ Überprüfe, ob alle IDs in der `.env` Datei korrekt sind
- ✅ Gib dem Bot alle erforderlichen Berechtigungen
- ✅ Überprüfe die Logs auf Fehlermeldungen

### "Ungültige User ID oder @mention"
- ✅ Stelle sicher, dass der User auf dem Server ist
- ✅ Nutze die numerische User-ID (z.B. `123456789`) oder @mention (z.B. `@Username`)
- ✅ Überprüfe die Schreibweise

## 📁 Projektstruktur

```
dc-bot/
├── main.js              # Hauptdatei mit allen Bot-Funktionen
├── package.json         # Dependencies und Scripts
├── .env.example         # Beispiel-Konfiguration
├── .env                 # Deine Konfiguration (nicht ins Git!)
├── .gitignore           # Git-Ignore-Regeln
└── README.md            # Diese Datei
```

## 🔐 Sicherheit

⚠️ **Wichtig:**
- Teile niemals deinen `DISCORD_TOKEN`!
- Nutze `.gitignore` um die `.env` Datei nicht zu committen
- Wenn der Token kompromittiert ist, resetze ihn sofort!
- Gib nur vertrauenswürdigen Personen die Support-Rolle

## 📦 Dependencies

- **discord.js** (v14.14.0) - Discord API Wrapper
- **dotenv** (v16.3.1) - Environment Variable Management

## 📄 Lizenz

MIT

## 👨‍💻 Support

Bei Fragen oder Problemen:
1. Überprüfe die Troubleshooting-Sektion oben
2. Schaue in die Console-Ausgabe für Fehler
3. Überprüfe alle IDs und Token in der `.env` Datei

## 🎯 Zukünftige Erweiterungen

Mögliche Features für zukünftige Versionen:
- Persistent Storage für Tickets (Datenbank)
- Ticket-Bewertungssystem
- Auto-Close nach Inaktivität
- Ticket-Kategorien und Priorisierung
- Statistik-Dashboard
- Custom Ticket-Nachrichten pro Typ

---

Made with ❤️ for Discord Communities
