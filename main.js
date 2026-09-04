const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  MessageCollector,
  AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================
// KONFIGURATION
// ============================================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;

// Validierung der Umgebungsvariablen
if (!DISCORD_TOKEN) {
  console.error('❌ Fehler: DISCORD_TOKEN nicht in .env gesetzt!');
  process.exit(1);
}
if (!LOG_CHANNEL_ID) {
  console.error('❌ Fehler: LOG_CHANNEL_ID nicht in .env gesetzt!');
  process.exit(1);
}
if (!SUPPORT_ROLE_ID) {
  console.error('❌ Fehler: SUPPORT_ROLE_ID nicht in .env gesetzt!');
  process.exit(1);
}
if (!TICKET_CATEGORY_ID) {
  console.error('❌ Fehler: TICKET_CATEGORY_ID nicht in .env gesetzt!');
  process.exit(1);
}

// ============================================
// DISCORD CLIENT SETUP
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Speicher für aktive Tickets
const activeTickets = new Map();

// ============================================
// HILFSFUNKTIONEN
// ============================================

/**
 * Erstellt ein Log-Embed
 */
function createLogEmbed(title, description, color = 0x3498db) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Ticket Bot' });
}

/**
 * Sendet eine Log-Nachricht in den Log-Channel
 */
async function sendLog(guild, title, description, color = 0x3498db) {
  try {
    const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (!logChannel) {
      console.error('❌ Log-Channel nicht gefunden!');
      return;
    }
    const embed = createLogEmbed(title, description, color);
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Fehler beim Senden des Logs:', error);
  }
}

/**
 * Erstellt ein Ticket-Transcript
 */
async function createTranscript(ticketChannel) {
  try {
    let transcript = `📋 TICKET TRANSCRIPT\n`;
    transcript += `Channel: ${ticketChannel.name}\n`;
    transcript += `Erstellt am: ${new Date().toLocaleString('de-DE')}\n`;
    transcript += `${'='.repeat(50)}\n\n`;

    const messages = await ticketChannel.messages.fetch({ limit: 100 });
    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    sortedMessages.forEach(msg => {
      const time = msg.createdAt.toLocaleString('de-DE');
      const content = msg.content || '(keine Textinhalte)';
      transcript += `[${time}] ${msg.author.username}: ${content}\n`;
      if (msg.attachments.size > 0) {
        msg.attachments.forEach(att => {
          transcript += `  📎 Anhang: ${att.name} (${att.size} bytes)\n`;
        });
      }
    });

    transcript += `\n${'='.repeat(50)}\n`;
    transcript += `Transcript Ende`;

    return transcript;
  } catch (error) {
    console.error('Fehler beim Erstellen des Transcripts:', error);
    return null;
  }
}

/**
 * Erstellt das Haupt-Ticket-Panel mit Buttons
 */
function createTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Ticket System')
    .setDescription('Wähle einen Tickettyp aus, um ein neues Ticket zu erstellen:')
    .setColor(0x2f3136)
    .setThumbnail(null)
    .addFields(
      { name: '🌾 Farmauftrag', value: 'Erstelle einen Ticket für Farmaufträge', inline: true },
      { name: '🧱 Bauauftrag', value: 'Erstelle einen Ticket für Bauaufträge', inline: true },
      { name: '📋 Auftrag', value: 'Erstelle einen Ticket für allgemeine Aufträge', inline: true },
      { name: '📝 Bewerbung', value: 'Sende eine Bewerbung ein', inline: true },
      { name: '📦 Lager', value: 'Erstelle einen Ticket für Lageraufträge', inline: true }
    )
    .setFooter({ text: 'Klicke auf einen Button um zu starten' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_farm')
        .setLabel('Farmauftrag')
        .setEmoji('🌾')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_build')
        .setLabel('Bauauftrag')
        .setEmoji('🧱')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_order')
        .setLabel('Auftrag')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_apply')
        .setLabel('Bewerbung')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_storage')
        .setLabel('Lager')
        .setEmoji('📦')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

/**
 * Erstellt die Buttons für das Ticket
 */
function createTicketButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('ticket_add_user')
        .setLabel('User Hinzufügen')
        .setEmoji('➕')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_remove_user')
        .setLabel('User Entfernen')
        .setEmoji('➖')
        .setStyle(ButtonStyle.Danger)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Ticket Schließen')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

  return [row1, row2];
}

/**
 * Erstellt ein neues Ticket
 */
async function createTicket(interaction, ticketType) {
  try {
    const guild = interaction.guild;
    const member = interaction.member;
    const ticketTypes = {
      farm: { name: '🌾-farmauftrag', emoji: '🌾', type: 'Farmauftrag' },
      build: { name: '🧱-bauauftrag', emoji: '🧱', type: 'Bauauftrag' },
      order: { name: '📋-auftrag', emoji: '📋', type: 'Auftrag' },
      apply: { name: '📝-bewerbung', emoji: '📝', type: 'Bewerbung' },
      storage: { name: '📦-lager', emoji: '📦', type: 'Lager' }
    };

    const typeInfo = ticketTypes[ticketType];
    if (!typeInfo) {
      await interaction.reply({
        content: '❌ Ungültiger Tickettyp!',
        ephemeral: true
      });
      return;
    }

    // Ticket Channel Namen erstellen
    const ticketNumber = Math.floor(Math.random() * 10000);
    const channelName = `${typeInfo.name}-${ticketNumber}`;

    // Channel erstellen
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: SUPPORT_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.AttachFiles
          ]
        }
      ]
    });

    // Ticket in der Map speichern
    activeTickets.set(ticketChannel.id, {
      creator: member.id,
      type: typeInfo.type,
      claimed: null,
      createdAt: new Date()
    });

    // Willkommens-Embed erstellen
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`${typeInfo.emoji} Neues Ticket erstellt`)
      .setDescription(`Willkommen ${member}!\n\nDein Ticket vom Typ **${typeInfo.type}** wurde erfolgreich erstellt.\n\nUnsere Support-Mitarbeiter werden sich bald bei dir melden.`)
      .addFields(
        { name: '👤 Ersteller', value: member.toString(), inline: true },
        { name: '📝 Tickettyp', value: typeInfo.type, inline: true },
        { name: '🔢 Ticketnummer', value: ticketNumber.toString(), inline: true }
      )
      .setColor(0x2ecc71)
      .setFooter({ text: 'Ticket Bot' })
      .setTimestamp();

    const buttons = createTicketButtons();
    await ticketChannel.send({ embeds: [welcomeEmbed], components: buttons });

    // Bestätigung an den User
    await interaction.reply({
      content: `✅ Dein Ticket wurde erstellt! ${ticketChannel}`,
      ephemeral: true
    });

    // Log-Nachricht
    await sendLog(
      guild,
      `🎫 Neues Ticket erstellt`,
      `**Tickettyp:** ${typeInfo.type}\n**Channel:** ${ticketChannel}\n**Ersteller:** ${member}\n**Ticketnummer:** ${ticketNumber}`,
      0x2ecc71
    );

  } catch (error) {
    console.error('Fehler beim Erstellen des Tickets:', error);
    try {
      await interaction.reply({
        content: '❌ Fehler beim Erstellen des Tickets!',
        ephemeral: true
      });
    } catch (e) {
      console.error('Fehler beim Senden der Fehlermeldung:', e);
    }
  }
}

/**
 * Schließt ein Ticket
 */
async function closeTicket(interaction, ticketChannel) {
  try {
    const guild = interaction.guild;
    const ticketData = activeTickets.get(ticketChannel.id);

    if (!ticketData) {
      await interaction.reply({
        content: '❌ Ticket-Daten nicht gefunden!',
        ephemeral: true
      });
      return;
    }

    // Transcript erstellen
    const transcript = await createTranscript(ticketChannel);
    
    // Transcript speichern oder hochladen
    if (transcript) {
      const creator = await guild.members.fetch(ticketData.creator);
      
      // Try direct message
      try {
        const transcriptAttachment = new AttachmentBuilder(
          Buffer.from(transcript, 'utf-8'),
          { name: `transcript-${ticketChannel.name}.txt` }
        );

        const transcriptEmbed = new EmbedBuilder()
          .setTitle('📋 Dein Ticket wurde geschlossen')
          .setDescription(`Dein Ticket **${ticketChannel.name}** wurde geschlossen.\n\nBitte beachte die angehängte Transcript-Datei für eine Übersicht aller Nachrichten.`)
          .setColor(0xe74c3c)
          .setTimestamp();

        await creator.send({ embeds: [transcriptEmbed], files: [transcriptAttachment] });
      } catch (dmError) {
        console.error('Konnte Transcript nicht per DM senden:', dmError);
        // Versuche im Log-Channel zu speichern
        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (logChannel) {
          const transcriptAttachment = new AttachmentBuilder(
            Buffer.from(transcript, 'utf-8'),
            { name: `transcript-${ticketChannel.name}.txt` }
          );
          await logChannel.send({
            content: `📋 Transcript für ${ticketChannel.name} (${ticketData.creator})`,
            files: [transcriptAttachment]
          });
        }
      }
    }

    // Log-Nachricht
    await sendLog(
      guild,
      `🔒 Ticket geschlossen`,
      `**Channel:** ${ticketChannel.name}\n**Ersteller:** <@${ticketData.creator}>\n**Typ:** ${ticketData.type}\n**Geschlossen von:** ${interaction.user}`,
      0xe74c3c
    );

    // Warte kurz, damit der Log gespeichert wird
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ticket aus der Map entfernen
    activeTickets.delete(ticketChannel.id);

    // Bestätigung
    await interaction.reply({
      content: '✅ Ticket wird gelöscht...',
      ephemeral: true
    });

    // Channel löschen (mit Verzögerung für visuelles Feedback)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await ticketChannel.delete('Ticket geschlossen');

  } catch (error) {
    console.error('Fehler beim Schließen des Tickets:', error);
    await interaction.reply({
      content: '❌ Fehler beim Schließen des Tickets!',
      ephemeral: true
    });
  }
}

/**
 * Claimit ein Ticket
 */
async function claimTicket(interaction, ticketChannel) {
  try {
    const ticketData = activeTickets.get(ticketChannel.id);

    if (!ticketData) {
      await interaction.reply({
        content: '❌ Ticket-Daten nicht gefunden!',
        ephemeral: true
      });
      return;
    }

    if (ticketData.claimed) {
      await interaction.reply({
        content: `❌ Dieses Ticket wurde bereits von <@${ticketData.claimed}> beansprucht!`,
        ephemeral: true
      });
      return;
    }

    // Ticket claimen
    ticketData.claimed = interaction.user.id;

    const claimEmbed = new EmbedBuilder()
      .setTitle('👤 Ticket wurde beansprucht')
      .setDescription(`${interaction.user} hat dieses Ticket beansprucht und kümmert sich nun darum.`)
      .setColor(0x3498db)
      .setFooter({ text: 'Ticket Bot' })
      .setTimestamp();

    await ticketChannel.send({ embeds: [claimEmbed] });

    await interaction.reply({
      content: `✅ Du hast dieses Ticket beansprucht!`,
      ephemeral: true
    });

    // Log
    await sendLog(
      interaction.guild,
      `👤 Ticket beansprucht`,
      `**Channel:** ${ticketChannel}\n**Beansprucht von:** ${interaction.user}`,
      0x3498db
    );

  } catch (error) {
    console.error('Fehler beim Claimen des Tickets:', error);
    await interaction.reply({
      content: '❌ Fehler beim Beanspruchen des Tickets!',
      ephemeral: true
    });
  }
}

/**
 * Fügt einen User zum Ticket hinzu
 */
async function addUserToTicket(interaction, ticketChannel) {
  try {
    const ticketData = activeTickets.get(ticketChannel.id);

    if (!ticketData) {
      await interaction.reply({
        content: '❌ Ticket-Daten nicht gefunden!',
        ephemeral: true
      });
      return;
    }

    // Frage nach dem User
    const replyEmbed = new EmbedBuilder()
      .setTitle('➕ User hinzufügen')
      .setDescription('Bitte antworte mit der Benutzer ID oder einem @mention:')
      .setColor(0x2ecc71);

    await interaction.reply({
      embeds: [replyEmbed],
      ephemeral: true
    });

    // Message Collector erstellen
    const filter = m => m.author.id === interaction.user.id;
    const collector = new MessageCollector(interaction.channel, { filter, time: 60000, max: 1 });

    collector.on('collect', async (msg) => {
      try {
        let userId = msg.content;

        // Versuche den User zu finden
        const userMatch = msg.mentions.users.first();
        if (userMatch) {
          userId = userMatch.id;
        } else if (/^\d+$/.test(userId)) {
          // Versuche die ID zu validieren
          const user = await client.users.fetch(userId);
          userId = user.id;
        } else {
          await interaction.followUp({
            content: '❌ Ungültige User ID oder @mention!',
            ephemeral: true
          });
          return;
        }

        // User zum Channel hinzufügen
        const permissions = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ];

        await ticketChannel.permissionOverwrites.create(userId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        });

        const addEmbed = new EmbedBuilder()
          .setTitle('➕ User hinzugefügt')
          .setDescription(`<@${userId}> wurde zum Ticket hinzugefügt.`)
          .setColor(0x2ecc71)
          .setFooter({ text: 'Ticket Bot' })
          .setTimestamp();

        await ticketChannel.send({ embeds: [addEmbed] });

        await interaction.followUp({
          content: `✅ User <@${userId}> wurde hinzugefügt!`,
          ephemeral: true
        });

        // Log
        await sendLog(
          interaction.guild,
          `➕ User zu Ticket hinzugefügt`,
          `**Channel:** ${ticketChannel}\n**Hinzugefügter User:** <@${userId}>\n**Hinzugefügt von:** ${interaction.user}`,
          0x2ecc71
        );

        msg.delete().catch(() => {});
      } catch (error) {
        console.error('Fehler beim Hinzufügen des Users:', error);
        await interaction.followUp({
          content: '❌ Fehler beim Hinzufügen des Users!',
          ephemeral: true
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '⏱️ Zeit abgelaufen!',
          ephemeral: true
        }).catch(() => {});
      }
    });

  } catch (error) {
    console.error('Fehler beim Hinzufügen des Users:', error);
    await interaction.reply({
      content: '❌ Fehler beim Hinzufügen des Users!',
      ephemeral: true
    });
  }
}

/**
 * Entfernt einen User vom Ticket
 */
async function removeUserFromTicket(interaction, ticketChannel) {
  try {
    const ticketData = activeTickets.get(ticketChannel.id);

    if (!ticketData) {
      await interaction.reply({
        content: '❌ Ticket-Daten nicht gefunden!',
        ephemeral: true
      });
      return;
    }

    // Frage nach dem User
    const replyEmbed = new EmbedBuilder()
      .setTitle('➖ User entfernen')
      .setDescription('Bitte antworte mit der Benutzer ID oder einem @mention:')
      .setColor(0xe74c3c);

    await interaction.reply({
      embeds: [replyEmbed],
      ephemeral: true
    });

    // Message Collector erstellen
    const filter = m => m.author.id === interaction.user.id;
    const collector = new MessageCollector(interaction.channel, { filter, time: 60000, max: 1 });

    collector.on('collect', async (msg) => {
      try {
        let userId = msg.content;

        // Versuche den User zu finden
        const userMatch = msg.mentions.users.first();
        if (userMatch) {
          userId = userMatch.id;
        } else if (/^\d+$/.test(userId)) {
          // Versuche die ID zu validieren
          const user = await client.users.fetch(userId);
          userId = user.id;
        } else {
          await interaction.followUp({
            content: '❌ Ungültige User ID oder @mention!',
            ephemeral: true
          });
          return;
        }

        // Verhindere, dass der Creator oder Support entfernt werden
        if (userId === ticketData.creator) {
          await interaction.followUp({
            content: '❌ Der Creator kann nicht entfernt werden!',
            ephemeral: true
          });
          return;
        }

        // User vom Channel entfernen
        await ticketChannel.permissionOverwrites.delete(userId);

        const removeEmbed = new EmbedBuilder()
          .setTitle('➖ User entfernt')
          .setDescription(`<@${userId}> wurde vom Ticket entfernt.`)
          .setColor(0xe74c3c)
          .setFooter({ text: 'Ticket Bot' })
          .setTimestamp();

        await ticketChannel.send({ embeds: [removeEmbed] });

        await interaction.followUp({
          content: `✅ User <@${userId}> wurde entfernt!`,
          ephemeral: true
        });

        // Log
        await sendLog(
          interaction.guild,
          `➖ User vom Ticket entfernt`,
          `**Channel:** ${ticketChannel}\n**Entfernter User:** <@${userId}>\n**Entfernt von:** ${interaction.user}`,
          0xe74c3c
        );

        msg.delete().catch(() => {});
      } catch (error) {
        console.error('Fehler beim Entfernen des Users:', error);
        await interaction.followUp({
          content: '❌ Fehler beim Entfernen des Users!',
          ephemeral: true
        });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '⏱️ Zeit abgelaufen!',
          ephemeral: true
        }).catch(() => {});
      }
    });

  } catch (error) {
    console.error('Fehler beim Entfernen des Users:', error);
    await interaction.reply({
      content: '❌ Fehler beim Entfernen des Users!',
      ephemeral: true
    });
  }
}

// ============================================
// EVENT LISTENER
// ============================================

/**
 * Bot ist online
 */
client.on('ready', () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);
  client.user.setActivity('Tickets', { type: 'WATCHING' }).catch(() => {});
});

/**
 * Button Interaktion
 */
client.on('interactionCreate', async (interaction) => {
  try {
    // Fehlerbehandlung für nicht-existierende Tickets
    if (interaction.isButton()) {
      const ticketChannel = interaction.channel;

      // Überprüfe ob dies ein Ticket-Channel ist
      if (!activeTickets.has(ticketChannel.id) && 
          interaction.customId.startsWith('ticket_') && 
          !interaction.customId.startsWith('ticket_farm') &&
          !interaction.customId.startsWith('ticket_build') &&
          !interaction.customId.startsWith('ticket_order') &&
          !interaction.customId.startsWith('ticket_apply') &&
          !interaction.customId.startsWith('ticket_storage')) {
        
        // Nur warnen, nicht abbrechen - könnte ein gerades neu erstelltes Ticket sein
      }
    }

    // Ticket-Panel Buttons
    if (interaction.customId === 'ticket_farm') {
      await createTicket(interaction, 'farm');
    } else if (interaction.customId === 'ticket_build') {
      await createTicket(interaction, 'build');
    } else if (interaction.customId === 'ticket_order') {
      await createTicket(interaction, 'order');
    } else if (interaction.customId === 'ticket_apply') {
      await createTicket(interaction, 'apply');
    } else if (interaction.customId === 'ticket_storage') {
      await createTicket(interaction, 'storage');
    }

    // Ticket Management Buttons
    else if (interaction.customId === 'ticket_claim') {
      await claimTicket(interaction, interaction.channel);
    } else if (interaction.customId === 'ticket_add_user') {
      await addUserToTicket(interaction, interaction.channel);
    } else if (interaction.customId === 'ticket_remove_user') {
      await removeUserFromTicket(interaction, interaction.channel);
    } else if (interaction.customId === 'ticket_close') {
      // Überprüfe Berechtigungen
      const member = interaction.member;
      const ticketData = activeTickets.get(interaction.channel.id);

      if (!member.roles.cache.has(SUPPORT_ROLE_ID) && 
          member.id !== ticketData?.creator &&
          !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({
          content: '❌ Du hast keine Berechtigung, um dieses Ticket zu schließen!',
          ephemeral: true
        });
        return;
      }

      await closeTicket(interaction, interaction.channel);
    }

  } catch (error) {
    console.error('Fehler bei Interaktion:', error);
    
    // Versuche eine Fehlermeldung zu senden
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ Ein Fehler ist aufgetreten!',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: '❌ Ein Fehler ist aufgetreten!',
          ephemeral: true
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Konnte Fehlermeldung nicht senden:', e);
    }
  }
});

/**
 * Nachricht wurde erstellt (um das Ticket-Panel einmalig zu erstellen)
 */
client.on('messageCreate', async (message) => {
  try {
    // Ignoriere Bot-Nachrichten
    if (message.author.bot) return;

    // Kommando um das Ticket-Panel zu senden
    if (message.content === '!ticket-setup') {
      // Überprüfe Berechtigungen
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.reply('❌ Du benötigst die Berechtigung "Kanäle verwalten"!');
        return;
      }

      const ticketPanel = createTicketPanel();
      await message.channel.send(ticketPanel);
      await message.reply('✅ Ticket-Panel wurde erstellt!');
    }
  } catch (error) {
    console.error('Fehler bei Nachrichtenverarbeitung:', error);
  }
});

/**
 * Guild Member Hinzugefügt
 */
client.on('guildMemberAdd', async (member) => {
  try {
    // Optional: Begrüßungsnachricht
    console.log(`➕ ${member.user.tag} ist dem Server beigetreten`);
  } catch (error) {
    console.error('Fehler bei guildMemberAdd:', error);
  }
});

/**
 * Fehlerbehandlung
 */
client.on('error', (error) => {
  console.error('💥 Discord Client Fehler:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unbehandelte Rejection bei', promise, ':', reason);
});

// ============================================
// BOT STARTEN
// ============================================
client.login(DISCORD_TOKEN)
  .catch((error) => {
    console.error('❌ Fehler beim Anmelden:', error);
    process.exit(1);
  });
