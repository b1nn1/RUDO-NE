// ───────────────────────────────
// 🧩 Imports and setup
// ───────────────────────────────
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  StringSelectMenuBuilder,
  AttachmentBuilder
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// ───────────────────────────────
// 🌿 Environment variables
// ───────────────────────────────
const token = process.env.DISCORD_TOKEN;
const staffRoleId = process.env.STAFF_ROLE_ID;
const WL_ID = process.env.WL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const RECEIPT_CHANNEL_ID = process.env.RECEIPT_CHANNEL_ID;

// ✅ Global Button Styles
const validStyles = {
  primary: ButtonStyle.Primary,
  secondary: ButtonStyle.Secondary,
  success: ButtonStyle.Success,
  danger: ButtonStyle.Danger,
};

// ═══════════════════════════════════════════════════════════
// 🤖 AUTORESPONDER SYSTEM
// ═══════════════════════════════════════════════════════════

const autoresponders = new Map();
const AUTORESPONDER_FILE = path.join(__dirname, 'autoresponders.json');

// Load autoresponders from JSON file
function loadAutoresponders() {
  try {
    if (fs.existsSync(AUTORESPONDER_FILE)) {
      const data = fs.readFileSync(AUTORESPONDER_FILE, 'utf8');
      const loaded = JSON.parse(data);
      for (const [key, value] of Object.entries(loaded)) {
        autoresponders.set(key, value);
      }
      console.log(`✅ Loaded ${autoresponders.size} autoresponders`);
    }
  } catch (error) {
    console.error('Error loading autoresponders:', error);
  }
}

// Save autoresponders to JSON file
function saveAutoresponders() {
  try {
    const obj = Object.fromEntries(autoresponders);
    fs.writeFileSync(AUTORESPONDER_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving autoresponders:', error);
  }
}

// Load autoresponders when bot starts
loadAutoresponders();

// ───────────────────────────────
// 🧾 Slash commands
// ───────────────────────────────
const commands = [
  // Ticket system
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a ticket panel with up to 3 buttons")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("label1").setDescription("Color for Button 1").setRequired(true))
  .addChannelOption(o => o.setName("category1").setDescription("Category for Button 1").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .addStringOption(o => o.setName("desc1").setDescription("Label for Button 1"))
    .addStringOption(o => o.setName("emoji1").setDescription("Emoji for Button 1"))
  .addStringOption(o => o.setName("label2").setDescription("Color for Button 2"))
  .addStringOption(o => o.setName("desc2").setDescription("Label for Button 2"))
    .addStringOption(o => o.setName("emoji2").setDescription("Emoji for Button 2"))
    .addChannelOption(o => o.setName("category2").setDescription("Category for Button 2").addChannelTypes(ChannelType.GuildCategory))
  .addStringOption(o => o.setName("label3").setDescription("Color for Button 3"))
  .addStringOption(o => o.setName("desc3").setDescription("Label for Button 3"))
    .addStringOption(o => o.setName("emoji3").setDescription("Emoji for Button 3"))
    .addChannelOption(o => o.setName("category3").setDescription("Category for Button 3").addChannelTypes(ChannelType.GuildCategory)),

  // Autoresponder system
  new SlashCommandBuilder()
    .setName('autoresponder')
    .setDescription('Manage autoresponders')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add an autoresponder')
        .addStringOption(o => o.setName('trigger').setDescription('Trigger word/phrase').setRequired(true))
        .addStringOption(o => o.setName('response').setDescription('Response message').setRequired(true))
        .addBooleanOption(o => o.setName('exact_match').setDescription('Require exact match (default: contains)'))
        .addBooleanOption(o => o.setName('delete_trigger').setDescription('Delete the trigger message'))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove an autoresponder')
        .addStringOption(o => o.setName('trigger').setDescription('Trigger to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all autoresponders')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable/disable an autoresponder')
        .addStringOption(o => o.setName('trigger').setDescription('Trigger to toggle').setRequired(true))
    ),

  // Create embed
  new SlashCommandBuilder()
    .setName("createembed")
    .setDescription("Create a fully customized embed")
    .addStringOption(o => o.setName("color").setDescription("Hex code or color name").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Embed title"))
    .addStringOption(o => o.setName("description").setDescription("Embed description"))
    .addStringOption(o => o.setName("footer").setDescription("Footer text"))
    .addStringOption(o => o.setName("footericon").setDescription("Footer icon URL"))
    .addBooleanOption(o => o.setName("timestamp").setDescription("Add timestamp"))
    .addStringOption(o => o.setName("thumbnail").setDescription("Thumbnail URL"))
    .addStringOption(o => o.setName("image").setDescription("Image URL"))
    .addStringOption(o => o.setName("authorname").setDescription("Author name"))
    .addStringOption(o => o.setName("authoricon").setDescription("Author icon URL")),

  // Spacer
  new SlashCommandBuilder()
    .setName("spacer")
    .setDescription("Add a spacer message to the channel")
    .addStringOption(o =>
      o.setName("length")
        .setDescription("Choose spacer length")
        .setRequired(true)
        .addChoices(
          { name: "Short", value: "short" },
          { name: "Long", value: "long" }
        )
    ),

  // Say (admin only)
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say something (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("text").setDescription("What should I say?").setRequired(true)
    ),

  // Div (admin only)
  new SlashCommandBuilder()
    .setName("div")
    .setDescription("Send a divider image embed (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Waitlist
  new SlashCommandBuilder()
    .setName("waitlist")
    .setDescription("Add a user to the waitlist with an order")
    .addUserOption(o => o.setName("user").setDescription("Customer being added").setRequired(true))
    .addStringOption(o => o.setName("item").setDescription("Item ordered").setRequired(true))
    .addStringOption(o => o.setName("mop").setDescription("Method of payment").setRequired(true)),

  // Prices (admin only)
  new SlashCommandBuilder()
    .setName("prices")
    .setDescription("Show pricing options dropdown")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Receipt (admin only)
  new SlashCommandBuilder()
    .setName("receipt")
    .setDescription("sent receipt in ticket and receipt channel")
    .addUserOption(o => o.setName("user").setDescription("Customer").setRequired(true))
    .addStringOption(o => o.setName("order").setDescription("items ordered").setRequired(true))
    .addIntegerOption(o => o.setName("revisions").setDescription("total changes").setRequired(true))
    .addStringOption(o => o.setName("mop").setDescription("Method of payment").setRequired(true))
    .addStringOption(o => o.setName("altprice").setDescription("value in other mop").setRequired(true))
    .addStringOption(o => o.setName("started").setDescription("mm.dd.yy").setRequired(true))
    .addStringOption(o => o.setName("finished").setDescription("mm.dd.yy").setRequired(true))
    .addStringOption(o => o.setName("id").setDescription("customer id").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

// ───────────────────────────────
// ⚙️ Register slash commands
// ───────────────────────────────
const rest = new REST({ version: "10" }).setToken(token);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    status: "dnd",
    activities: [{ name: "a biohzrd bot", type: 3 }],
  });

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash commands registered!");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
});

// ───────────────────────────────
// 🎯 SINGLE Interaction handler
// ───────────────────────────────
client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "autoresponder") {
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ 
          content: "🚫 You need Administrator permission to manage autoresponders.", 
          flags: 64 
        });
      }

      const subcommand = interaction.options.getSubcommand();

      // ─── ADD AUTORESPONDER ───
      if (subcommand === "add") {
        const trigger = interaction.options.getString("trigger").toLowerCase();
        const response = interaction.options.getString("response");
        const exactMatch = interaction.options.getBoolean("exact_match") || false;
        const deleteTrigger = interaction.options.getBoolean("delete_trigger") || false;

        autoresponders.set(trigger, {
          response: response,
          exactMatch: exactMatch,
          deleteTrigger: deleteTrigger,
          enabled: true,
          createdBy: interaction.user.id,
          createdAt: Date.now()
        });

        saveAutoresponders();

        const embed = new EmbedBuilder()
          .setTitle("✅ Autoresponder Added")
          .setDescription(`**Trigger:** \`${trigger}\`\n**Response:** ${response}\n**Match Type:** ${exactMatch ? 'Exact Match' : 'Contains'}\n**Delete Trigger:** ${deleteTrigger ? 'Yes' : 'No'}`)
          .setColor(0x00ff00)
          .setFooter({ text: `Added by ${interaction.user.tag}` })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      // ─── REMOVE AUTORESPONDER ───
      if (subcommand === "remove") {
        const trigger = interaction.options.getString("trigger").toLowerCase();

        if (!autoresponders.has(trigger)) {
          return interaction.reply({ 
            content: `❌ No autoresponder found with trigger: \`${trigger}\``, 
            flags: 64 
          });
        }

        autoresponders.delete(trigger);
        saveAutoresponders();

        return interaction.reply({ 
          content: `✅ Autoresponder with trigger \`${trigger}\` has been removed.`, 
          flags: 64 
        });
      }

      // ─── LIST AUTORESPONDERS ───
      if (subcommand === "list") {
        if (autoresponders.size === 0) {
          return interaction.reply({ 
            content: "📭 No autoresponders configured yet.", 
            flags: 64 
          });
        }

        const embed = new EmbedBuilder()
          .setTitle("📋 Autoresponders List")
          .setColor(0x5865f2)
          .setFooter({ text: `Total: ${autoresponders.size} autoresponders` })
          .setTimestamp();

        let description = "";
        let index = 1;

        for (const [trigger, data] of autoresponders) {
          const status = data.enabled ? "🟢" : "🔴";
          const matchType = data.exactMatch ? "Exact" : "Contains";
          const deleteMsg = data.deleteTrigger ? "🗑️" : "";
          description += `**${index}.** ${status} ${deleteMsg} \`${trigger}\` *[${matchType}]*\n`;
          description += `   ↳ ${data.response.substring(0, 50)}${data.response.length > 50 ? '...' : ''}\n\n`;
          index++;
        }

        embed.setDescription(description);

        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      // ─── TOGGLE AUTORESPONDER ───
      if (subcommand === "toggle") {
        const trigger = interaction.options.getString("trigger").toLowerCase();

        if (!autoresponders.has(trigger)) {
          return interaction.reply({ 
            content: `❌ No autoresponder found with trigger: \`${trigger}\``, 
            flags: 64 
          });
        }

        const data = autoresponders.get(trigger);
        data.enabled = !data.enabled;
        autoresponders.set(trigger, data);
        saveAutoresponders();

        return interaction.reply({ 
          content: `${data.enabled ? '🟢' : '🔴'} Autoresponder \`${trigger}\` is now **${data.enabled ? 'enabled' : 'disabled'}**.`, 
          flags: 64 
        });
      }
    }

    // ───────────── /spacer
    if (interaction.isChatInputCommand() && interaction.commandName === "spacer") {
      const length = interaction.options.getString("length");
      const spacer = length === "long" ? "\u200B\n".repeat(30) : "\u200B";
      await interaction.channel.send(spacer);
      return interaction.reply({ content: `✅ ${length} spacer added!`, ephemeral: true });
    }

    // ───────────── /say
    if (interaction.isChatInputCommand() && interaction.commandName === "say") {
      const text = interaction.options.getString("text");
      await interaction.channel.send(text);
      return interaction.reply({ content: "✅ Message sent!", ephemeral: true });
    }

    // ───────────── /div
    if (interaction.isChatInputCommand() && interaction.commandName === "div") {
      const embed = new EmbedBuilder()
        .setColor(0x36393f)
        .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png?ex=68f3cea1&is=68f27d21&hm=715e94744bb7c42a3289fc6dade894ba354d6b1cf0056b6a6ff0a6b83ef2da17");
      await interaction.channel.send({ embeds: [embed] });
      return interaction.reply({ content: "✅ Divider sent!", ephemeral: true });
    }

    // ───────────── /createembed
    if (interaction.isChatInputCommand() && interaction.commandName === "createembed") {
      const color = interaction.options.getString("color");
      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");
      const footer = interaction.options.getString("footer");
      const footericon = interaction.options.getString("footericon");
      const timestamp = interaction.options.getBoolean("timestamp");
      const thumbnail = interaction.options.getString("thumbnail");
      const image = interaction.options.getString("image");
      const authorname = interaction.options.getString("authorname");
      const authoricon = interaction.options.getString("authoricon");

      const embed = new EmbedBuilder().setColor(color || "#36393f");
      if (title) embed.setTitle(title);
      if (description) embed.setDescription(description);
      if (footer) embed.setFooter(footericon ? { text: footer, iconURL: footericon } : { text: footer });
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (image) embed.setImage(image);
      if (authorname) embed.setAuthor(authoricon ? { name: authorname, iconURL: authoricon } : { name: authorname });
      if (timestamp) embed.setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      return interaction.reply({ content: "✅ Embed created!", ephemeral: true });
    }

    // ───────────── /receipt
    if (interaction.isChatInputCommand() && interaction.commandName === "receipt") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You do not have permission to use this command.", 
          ephemeral: true 
        });
      }

      const recChannel = interaction.guild.channels.cache.get(RECEIPT_CHANNEL_ID);
      if (!recChannel?.isTextBased()) {
        return interaction.reply({ 
          content: "❌ receipt channel not found.", 
          ephemeral: true 
        });
      }

      const user = interaction.options.getUser("user");
      const order = interaction.options.getString("order");
      const revisions = interaction.options.getInteger("revisions");
      const mop = interaction.options.getString("mop");
      const altprice = interaction.options.getString("altprice");
      const startdate = interaction.options.getString("started");
      const enddate = interaction.options.getString("finished");
      const id = interaction.options.getString("id");

      const formattedOrder = order
        .trim()
        .split(/\n+/)
        .map(line => line.trim() ? `> ${line.trim()}` : '>')
        .join('\n');

      const receipt = `_ _ 　  ✦　　.　　𓂀　　.　　✧
_ _　 　꒰ ◜　\`🧾\`　◝ ꒱　⁺　**${user}**'s ◟
_ _　         ◍　˚  \`💬\`　࿓　order receipt
_ _ 　  ˚　　 .　 　\`📦\`　　˚　 　 .　　 ˚
_ _　   ⨀ 𓄹 ⨀　⏑⏑　overall　**order**
${formattedOrder}

_ _　   · 𐙚 ·´　\`📝\`　｡　Ⴢ　revisions: ${revisions}
_ _　　 ⁺　\`🐾\`　𓐆　˚　ฅ　payment: ${mop}
_ _　　 ⁺　\`🗯\`　𓐆　˚　Ⴢ　alternate price: ${altprice}
_ _ 　  ˚　　 .　 　\`🪾\`　　˚　 　 .　　 ˚
-# _ _　　꙳ 𓊝 ꙳　date started: ${startdate}
-# _ _　　꙳ 𓆸 ꙳　date finished: ${enddate}
_ _ 　  ⨀　𓄹　⨀　id: ${id}
_ _ 　  ✿　　.　　✦　　.　　˚`;

      await recChannel.send({ content: receipt });
      return interaction.reply({ content: receipt, ephemeral: false });
    }

    // ───────────── /waitlist Command with single container
    if (interaction.isChatInputCommand() && interaction.commandName === "waitlist") {
        if (!interaction.member.roles.cache.has(staffRoleId)) 
            return interaction.reply({ content: "🚫 No permission.", ephemeral: true });
        const wlChannel = interaction.guild.channels.cache.get(WL_ID);
        if (!wlChannel?.isTextBased()) 
            return interaction.reply({ content: "❌ Waitlist channel not found.", ephemeral: true });
        const user = interaction.options.getUser("user");
        const item = interaction.options.getString("item");
        const mop = interaction.options.getString("mop");

        await wlChannel.send({
            content: `_ _\n_ _ 　  ✦　　.　　𓂀　　.　　✧\n_ _　 　꒰ ◜　\`💉\`　◝ ꒱　⁺　${user}**'s** ◟\n_ _　         ◍　˚  \`💬\`　࿓　queue spot\n_ _`
        });

        const container = {
            type: 17,
            components: [
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png" },
                        spoiler: false,
                        description: null
                    }]
                },
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927468182667274/ecc8bc2b4d4847f9e7f0daeaffc3605e.jpg" }
                    }]
                },
                {
                    type: 10,
                    content: `_ _ 　  ˚　　 .　 　\`💀\`　　˚　 　 .　　 ˚\n_ _　   ⨀ 𓄹 ⨀　⏑⏑　new　**order**\n_ _　   · 𐙚 ·´　\`🕸\`　｡　Ⴢ　item: ${item}\n_ _　　 ⁺　\`🦴\`　𓐆　˚　ฅ　payment: ${mop}\n_ _ 　  ˚　　 .　 　\`🗯\`　　˚　 　 .　　 ˚\n_ _　　꙳ 𓊝 ꙳　**status**: pending\n_ _ 　  ✿　　.　　✦　　.　　˚`
                },
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png" },
                        spoiler: false,
                        description: null
                    }]
                },
                {
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: "wait_status",
                        placeholder: "⠀ ⠀ ⠀/ᐠ > . < ̥マ    ݂۫   status",
                        options: [
                            { label: "⃟", value: "paid", description: "𓏵۪۪　﹒　　 paid　𓏼", emoji: { id: "1445921537340211242", name: "unknown", animated: true } },
                            { label: "⃟", value: "processing", description: "𓏫　⌣　　﹕　processing　𓈒　 ͝ །⠀⠀", emoji: { id: "1445919743788978367", name: "unknown" } },
                            { label: "⃟", value: "complete", description: "◟ ͜  ︵◞◟　　﹕　complete　𓂃𓏼⁾⁾", emoji: { id: "1445921420327653417", name: "unknown", animated: true } }
                        ]
                    }]
                },
                {
                    type: 14,
                    spacing: 1,
                    divider: true
                }
            ]
        };

        await wlChannel.send({ 
            components: [container],
            flags: 32768 // MessageFlags.IsComponentsV2
        });
        return interaction.reply({ content: "✅ Order added to waitlist!", ephemeral: true });
    }

    // ───────────── Status select menu handler
    client.on("interactionCreate", async interaction => {
        if (!interaction.isStringSelectMenu() || interaction.customId !== "wait_status") return;

        try {
            const selected = interaction.values[0];

            // Rebuild the entire container from scratch to ensure proper structure
            const item = interaction.message.components[0].components[2].content.match(/item:\s*([^\n]+)/)?.[1] || 'unknown';
            const mop = interaction.message.components[0].components[2].content.match(/payment:\s*([^\n]+)/)?.[1] || 'unknown';

            const updatedComponents = [
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png" },
                        spoiler: false,
                        description: null
                    }]
                },
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927468182667274/ecc8bc2b4d4847f9e7f0daeaffc3605e.jpg" }
                    }]
                },
                {
                    type: 10,
                    content: `_ _ 　  ˚　　 .　 　\`💀\`　　˚　 　 .　　 ˚\n_ _　   ⨀ 𓄹 ⨀　⏑⏑　new　**order**\n_ _　   · 𐙚 ·´　\`🕸\`　｡　Ⴢ　item: ${item}\n_ _　　 ⁺　\`🦴\`　𓐆　˚　ฅ　payment: ${mop}\n_ _ 　  ˚　　 .　 　\`🗯\`　　˚　 　 .　　 ˚\n_ _　　꙳ 𓊝 ꙳　**status**: ${selected}\n_ _ 　  ✿　　.　　✦　　.　　˚`
                },
                {
                    type: 12,
                    items: [{
                        media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png" },
                        spoiler: false,
                        description: null
                    }]
                }
            ];

            // Only add select menu if not complete
            if (selected !== "complete") {
                updatedComponents.push({
                    type: 1,
                    components: [{
                        type: 3,
                        custom_id: "wait_status",
                        placeholder: "⠀ ⠀ ⠀/ᐠ > . < ̥マ    ݂۫   status",
                        options: [
                            { label: "⃟", value: "paid", description: "𓏵۪۪　﹒　　 paid　𓏼", emoji: { id: "1445921537340211242", name: "unknown", animated: true } },
                            { label: "⃟", value: "processing", description: "𓏫　⌣　　﹕　processing　𓈒　 ͝ །⠀⠀", emoji: { id: "1445919743788978367", name: "unknown" } },
                            { label: "⃟", value: "complete", description: "◟ ͜  ︵◞◟　　﹕　complete　𓂃𓏼⁾⁾", emoji: { id: "1445921420327653417", name: "unknown", animated: true } }
                        ]
                    }]
                });
                updatedComponents.push({
                    type: 14,
                    spacing: 1,
                    divider: true
                });
            }

            const newContainer = {
                type: 17,
                components: updatedComponents
            };

            await interaction.update({ 
                components: [newContainer],
                flags: 32768
            });
        } catch (error) {
            console.error('Error handling select menu:', error);
            await interaction.reply({ 
                content: '❌ Error updating status', 
                ephemeral: true 
            }).catch(() => {});
        }
    });
    // ───────────── /ticket as SELECT MENU
    if (interaction.isChatInputCommand() && interaction.commandName === "ticket") {
      const ticketOptions = [];

      for (let i = 1; i <= 3; i++) {
        const label = interaction.options.getString(`label${i}`);
        const desc = interaction.options.getString(`desc${i}`);
        const category = interaction.options.getChannel(`category${i}`);
        const emoji = interaction.options.getString(`emoji${i}`);

        if (!label || !category) continue;

        ticketOptions.push({
          label,
          value: `ticket_${i}`,
          description: `${desc}`,
          emoji: emoji || undefined,
          categoryId: category.id
        });
      }

      if (!ticketOptions.length) {
        return interaction.reply({ 
          content: "❌ No ticket options were configured!", 
          flags: 64 
        });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticket_create_select")
        .setPlaceholder(" ♡ྀི̣̣̥ ‿    select ticket    𓈒ֵ۫𓏼 ୨")
        .addOptions(ticketOptions.map(opt => ({
          label: opt.label,
          value: opt.value,
          description: opt.description,
          emoji: opt.emoji
        })));

      // save mapping
      interaction.client.ticketButtonCategories = Object.fromEntries(
        ticketOptions.map(opt => [opt.value, opt.categoryId])
      );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.channel.send({ 
        components: [row]
      });

      return interaction.reply({ content: "✅ Ticket panel created!", flags: 64 });
    }

    // ───────────── HANDLE SELECT MENU (Create Ticket)
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_create_select") {
      const selected = interaction.values[0];
      const categoryId = interaction.client.ticketButtonCategories?.[selected];

      if (!categoryId) {
        return interaction.reply({ 
          content: "❌ No category set for this ticket.", 
          flags: 64 
        });
      }

      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
      );

      if (existing) {
        return interaction.reply({ 
          content: "❌ You already have a ticket!", 
          flags: 64 
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        parent: categoryId,
        topic: `Owner: ${interaction.user.id}`,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          { id: staffRoleId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] }
        ]
      });
    
      // Create Components V2 container
      const container = {
        type: 17,
        components: [
          {
            type: 10,
            content: `<@&${staffRoleId}> <@${interaction.user.id}>`
          },
          {
            type: 12,
            items: [{
              media: { url: "https://cdn.discordapp.com/attachments/1439498545106259969/1449781782546354258/download_14.jpg" },
              spoiler: false,
              description: null
            }]
          },
          {
            type: 10,
            content: `⠀ ⠀ ⠀/ᐠ > . < ̥マ ݂۫ 𓏼 ₊ ͜ ◞ ྀིྀ\n> ⠀ ⠀ ꒰৮ ྐ✚ ₊　type \`.start\` to begin ⠀ ♡︎ ༷݁ ꒱ྀ\n> ⠀ ⠀ ꒷꒦ ͜ ¦𓏵 ᭪ read tos b4 ordering 𓏼 ͡ ⑅ ♡ \n> ⠀ ⠀ 𓉸ྀི 𓂃˚ thank you for buying! ྀི ͡ ̣̣̣ ׁ ︶\n\n`
          },
          {
            type: 1,
            components: [{
              type: 3,
              custom_id: "ticket_actions",
              placeholder: "〖 𓉳ིྀ ׁ  ༘    admin ticket  actions   ܸ ͜͜〗",
              options: [
                { label: "⃟", value: "ticket_close", description: "close ticket" },
                { label: "⃟", value: "ticket_add_user", description: "add user" },
                { label: "⃟", value: "ticket_remove_user", description: "remove user" },
                { label: "⃟", value: "ticket_lock", description: "lock ticket" },
                { label: "⃟", value: "ticket_send_receipt", description: "send receipt" },
                { label: "⃟", value: "ticket_delivery", description: "send delivery" },
                { label: "⃟", value: "ticket_ban", description: "ban user" },
                { label: "⃟", value: "ticket_priority", description: "set priority" },
                { label: "⃟", value: "ticket_archive", description: "archive ticket" }
              ]
            }]
          },
          {
            type: 14,
            spacing: 1,
            divider: true
          }
        ]
      };

      await ticketChannel.send({
        components: [container],
        flags: 32768
      });

      await interaction.reply({ 
        content: `✅ Ticket created: ${ticketChannel}`, 
        flags: 64 
      });
    }

    // ───────────── HANDLE TICKET ACTIONS SELECT MENU
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_actions") {
      const action = interaction.values[0];

      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You don't have permission to use this.", 
          flags: 64
        });
      }

      // CLOSE TICKET
      if (action === "ticket_close") {
        await interaction.reply({ 
          content: "📝 Generating transcript and closing ticket...", 
          flags: 64
        });

        try {
          let allMessages = [];
          let lastMessageId;

          while (true) {
            const options = { limit: 100 };
            if (lastMessageId) options.before = lastMessageId;

            const messages = await interaction.channel.messages.fetch(options);
            if (messages.size === 0) break;

            allMessages.push(...messages.values());
            lastMessageId = messages.last().id;
            if (messages.size < 100) break;
          }

          const sortedMessages = allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
          const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

          let transcript = `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Ticket Transcript - ${escapeHtml(interaction.channel.name)}</title>
              <style>
                  @import url('https://fonts.googleapis.com/css2?family=Whitney:wght@400;500;600;700&display=swap');

                  * { margin: 0; padding: 0; box-sizing: border-box; }

                  body {
                      font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                      background-color: #313338;
                      color: #dbdee1;
                      font-size: 16px;
                      line-height: 1.375;
                  }

                  .discord-container {
                      display: flex;
                      height: 100vh;
                      overflow: hidden;
                  }

                  .channel-sidebar {
                      width: 240px;
                      background-color: #2b2d31;
                      display: flex;
                      flex-direction: column;
                      flex-shrink: 0;
                  }

                  .server-name {
                      height: 48px;
                      padding: 0 16px;
                      display: flex;
                      align-items: center;
                      font-weight: 600;
                      font-size: 16px;
                      border-bottom: 1px solid #1e1f22;
                      box-shadow: 0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05), 0 2px 0 rgba(4,4,5,0.05);
                  }

                  .channel-list {
                      flex: 1;
                      padding: 8px;
                      overflow-y: auto;
                  }

                  .channel-item {
                      display: flex;
                      align-items: center;
                      padding: 6px 8px;
                      margin: 1px 0;
                      border-radius: 4px;
                      color: #949ba4;
                      font-size: 16px;
                      cursor: pointer;
                  }

                  .channel-item.active {
                      background-color: #404249;
                      color: #f2f3f5;
                  }

                  .channel-icon {
                      width: 20px;
                      margin-right: 6px;
                      color: #80848e;
                  }

                  .chat-container {
                      flex: 1;
                      display: flex;
                      flex-direction: column;
                      background-color: #313338;
                  }

                  .chat-header {
                      height: 48px;
                      padding: 0 16px;
                      display: flex;
                      align-items: center;
                      border-bottom: 1px solid #26272b;
                      box-shadow: 0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05), 0 2px 0 rgba(4,4,5,0.05);
                  }

                  .channel-name {
                      display: flex;
                      align-items: center;
                      font-weight: 600;
                      font-size: 16px;
                      color: #f2f3f5;
                  }

                  .channel-name::before {
                      content: '#';
                      margin-right: 8px;
                      color: #80848e;
                      font-weight: 300;
                  }

                  .channel-topic {
                      margin-left: 12px;
                      padding-left: 12px;
                      border-left: 1px solid #3f4147;
                      color: #949ba4;
                      font-size: 14px;
                      font-weight: 400;
                  }

                  .messages-wrapper {
                      flex: 1;
                      overflow-y: auto;
                      padding: 16px 0;
                  }

                  .message-group {
                      padding: 0 16px;
                      margin-bottom: 16px;
                      position: relative;
                  }

                  .message-group:hover {
                      background-color: #2e3035;
                  }

                  .message-header {
                      display: flex;
                      align-items: center;
                      margin-bottom: 2px;
                  }

                  .avatar {
                      width: 40px;
                      height: 40px;
                      border-radius: 50%;
                      margin-right: 16px;
                      margin-top: 2px;
                      flex-shrink: 0;
                      cursor: pointer;
                      overflow: hidden;
                  }

                  .avatar-image {
                      width: 100%;
                      height: 100%;
                      object-fit: cover;
                  }

                  .message-content-wrapper {
                      flex: 1;
                      min-width: 0;
                  }

                  .message-author {
                      display: flex;
                      align-items: center;
                  }

                  .username {
                      font-weight: 500;
                      font-size: 16px;
                      color: #f2f3f5;
                      cursor: pointer;
                      line-height: 22px;
                  }

                  .username:hover {
                      text-decoration: underline;
                  }

                  .bot-tag {
                      background-color: #5865f2;
                      color: #ffffff;
                      font-size: 10px;
                      font-weight: 500;
                      padding: 2px 4px;
                      border-radius: 3px;
                      margin-left: 6px;
                      text-transform: uppercase;
                      line-height: 16px;
                      vertical-align: middle;
                  }

                  .timestamp {
                      font-size: 12px;
                      color: #949ba4;
                      margin-left: 6px;
                      font-weight: 500;
                      line-height: 22px;
                  }

                  .message-text {
                      color: #dbdee1;
                      font-size: 16px;
                      line-height: 22px;
                      word-wrap: break-word;
                      margin-top: 2px;
                  }

                  .embed {
                      display: grid;
                      margin-top: 8px;
                      max-width: 520px;
                      border-left: 4px solid #5865f2;
                      background-color: #2b2d31;
                      border-radius: 4px;
                      padding: 8px 16px 16px 12px;
                  }

                  .embed-title {
                      font-size: 16px;
                      font-weight: 600;
                      color: #00b0f4;
                      margin-bottom: 8px;
                      line-height: 22px;
                  }

                  .embed-description {
                      font-size: 14px;
                      color: #dbdee1;
                      line-height: 18px;
                  }

                  .attachment {
                      margin-top: 8px;
                      max-width: 520px;
                  }

                  .attachment-link {
                      display: inline-flex;
                      align-items: center;
                      padding: 8px 12px;
                      background-color: #2b2d31;
                      border: 1px solid #1e1f22;
                      border-radius: 4px;
                      color: #00a8fc;
                      text-decoration: none;
                      font-size: 14px;
                  }

                  .attachment-link:hover {
                      background-color: #1e1f22;
                      text-decoration: underline;
                  }

                  .attachment-icon {
                      margin-right: 8px;
                  }

                  .divider {
                      height: 1px;
                      background-color: #3f4147;
                      margin: 24px 16px;
                  }

                  .info-bar {
                      background-color: #2b2d31;
                      border-top: 1px solid #1e1f22;
                      padding: 16px;
                      text-align: center;
                      color: #949ba4;
                      font-size: 14px;
                  }

                  .info-bar-content {
                      max-width: 800px;
                      margin: 0 auto;
                  }

                  .info-stat {
                      display: inline-block;
                      margin: 0 16px;
                  }

                  .info-stat strong {
                      color: #f2f3f5;
                  }

                  ::-webkit-scrollbar {
                      width: 16px;
                  }

                  ::-webkit-scrollbar-track {
                      background-color: #2b2d31;
                  }

                  ::-webkit-scrollbar-thumb {
                      background-color: #1a1b1e;
                      border: 4px solid #2b2d31;
                      border-radius: 8px;
                  }

                  ::-webkit-scrollbar-thumb:hover {
                      background-color: #0f1014;
                  }
              </style>
          </head>
          <body>
              <div class="discord-container">
                  <div class="channel-sidebar">
                      <div class="server-name">${escapeHtml(interaction.guild.name)}</div>
                      <div class="channel-list">
                          <div class="channel-item active">
                              <span class="channel-icon">#</span>
                              <span>${escapeHtml(interaction.channel.name)}</span>
                          </div>
                      </div>
                  </div>

                  <div class="chat-container">
                      <div class="chat-header">
                          <div class="channel-name">${escapeHtml(interaction.channel.name)}</div>
                          <div class="channel-topic">Ticket Transcript • Closed by ${escapeHtml(interaction.user.tag)} • ${new Date().toLocaleDateString()}</div>
                      </div>

                      <div class="messages-wrapper">`;

          sortedMessages.forEach(msg => {
            const timestamp = new Date(msg.createdTimestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });

            const avatarUrl = msg.author.displayAvatarURL({ extension: 'png', size: 128 });
            const botTag = msg.author.bot ? '<span class="bot-tag">BOT</span>' : '';

            transcript += `
                          <div class="message-group">
                              <div class="message-header">
                                  <div class="avatar">
                                      <img src="${avatarUrl}" alt="${escapeHtml(msg.author.username)}" class="avatar-image" />
                                  </div>
                                  <div class="message-content-wrapper">
                                      <div class="message-author">
                                          <span class="username">${escapeHtml(msg.author.username)}</span>${botTag}
                                          <span class="timestamp">${timestamp}</span>
                                      </div>`;

            if (msg.content) {
              transcript += `
                                      <div class="message-text">${escapeHtml(msg.content)}</div>`;
            }

            if (msg.embeds.length > 0) {
              msg.embeds.forEach(embed => {
                transcript += `
                                      <div class="embed">`;
                if (embed.title) {
                  transcript += `
                                          <div class="embed-title">${escapeHtml(embed.title)}</div>`;
                }
                if (embed.description) {
                  transcript += `
                                          <div class="embed-description">${escapeHtml(embed.description.substring(0, 500))}</div>`;
                }
                transcript += `
                                      </div>`;
              });
            }

            if (msg.attachments.size > 0) {
              msg.attachments.forEach(att => {
                transcript += `
                                      <div class="attachment">
                                          <a href="${att.url}" target="_blank" class="attachment-link">
                                              <span class="attachment-icon">📎</span>
                                              ${escapeHtml(att.name)}
                                          </a>
                                      </div>`;
              });
            }

            transcript += `
                                  </div>
                              </div>
                          </div>`;
          });

          transcript += `
                      </div>

                      <div class="info-bar">
                          <div class="info-bar-content">
                              <span class="info-stat"><strong>${sortedMessages.length}</strong> messages</span>
                              <span class="info-stat">Closed by <strong>${escapeHtml(interaction.user.tag)}</strong></span>
                              <span class="info-stat">Generated on <strong>${new Date().toLocaleString()}</strong></span>
                          </div>
                      </div>
                  </div>
              </div>
          </body>
          </html>`;

          const buffer = Buffer.from(transcript, 'utf-8');
          const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}-${Date.now()}.html` });

          const logChannelId = "1445580720839069696";
          const logChannel = interaction.guild.channels.cache.get(logChannelId);

          if (logChannel) {
            const transcriptEmbed = new EmbedBuilder()
              .setTitle("📋 Ticket Closed")
              .setDescription(`Ticket: ${interaction.channel.name}`)
              .addFields(
                { name: "Closed by", value: `${interaction.user.tag}`, inline: true },
                { name: "Messages", value: `${sortedMessages.length}`, inline: true },
                { name: "Date", value: `${new Date().toLocaleString()}`, inline: true }
              )
              .setColor(0xff0000)
              .setFooter({ text: "💡 Download the HTML file and open it in your browser" })
              .setTimestamp();

            await logChannel.send({ embeds: [transcriptEmbed], files: [attachment] });
          }

          setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
        } catch (error) {
          console.error(error);
          await interaction.followUp({ content: "⚠️ Error generating transcript, but closing anyway...", flags: 64 });
          setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
        }
      }

      // ADD USER
      if (action === "ticket_add_user") {
        return interaction.showModal({
          title: "Add User to Ticket",
          custom_id: "add_user_modal",
          components: [{
            type: 1,
            components: [{ type: 4, custom_id: "user_id", label: "User ID", style: 1, placeholder: "Enter user ID", required: true }]
          }]
        });
      }

      // REMOVE USER
      if (action === "ticket_remove_user") {
        return interaction.showModal({
          title: "Remove User from Ticket",
          custom_id: "remove_user_modal",
          components: [{
            type: 1,
            components: [{ type: 4, custom_id: "user_id", label: "User ID", style: 1, placeholder: "Enter user ID", required: true }]
          }]
        });
      }

      // LOCK TICKET
      if (action === "ticket_lock") {
        try {
          const ticketOwnerId = interaction.channel.topic?.match(/Owner: (\d+)/)?.[1];
          const ticketOwner = ticketOwnerId ? interaction.guild.members.cache.get(ticketOwnerId) : null;

          if (ticketOwner) {
            await interaction.channel.permissionOverwrites.edit(ticketOwner.id, { SendMessages: false });
          }

          return interaction.reply({ content: "🔒 Ticket locked.", flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: "❌ Failed to lock ticket.", flags: 64 });
        }
      }

      // SEND RECEIPT
      if (action === "ticket_send_receipt") {
        return interaction.showModal({
          title: "Send Receipt",
          custom_id: "receipt_modal",
          components: [
            { type: 1, components: [{ type: 4, custom_id: "order", label: "Order Items", style: 2, placeholder: "Enter order items", required: true }] },
            { type: 1, components: [{ type: 4, custom_id: "mop", label: "Method of Payment", style: 1, placeholder: "e.g., cashapp", required: true }] },
            { type: 1, components: [{ type: 4, custom_id: "revisions", label: "Number of Revisions", style: 1, placeholder: "e.g., 2", required: true }] },
            { type: 1, components: [{ type: 4, custom_id: "dates", label: "Start Date | End Date", style: 1, placeholder: "mm.dd.yy | mm.dd.yy", required: true }] }
          ]
        });
      }

      // SEND DELIVERY
      if (action === "ticket_delivery") {
        return interaction.showModal({
          title: "Send Delivery",
          custom_id: "delivery_modal",
          components: [
            { 
              type: 1, 
              components: [{ 
                type: 4, 
                custom_id: "delivery_link", 
                label: "Delivery Link", 
                style: 1, 
                placeholder: "Enter the delivery link (URL)", 
                required: true 
              }] 
            },
            { 
              type: 1, 
              components: [{ 
                type: 4, 
                custom_id: "order_items", 
                label: "Order Items", 
                style: 2, 
                placeholder: "What did they order?", 
                required: true 
              }] 
            }
          ]
        });
      }



      // BAN USER
      if (action === "ticket_ban") {
        try {
          const ticketOwnerId = interaction.channel.topic?.match(/Owner: (\d+)/)?.[1];
          const ticketOwner = ticketOwnerId ? interaction.guild.members.cache.get(ticketOwnerId) : null;

          if (!ticketOwner) return interaction.reply({ content: "❌ Could not find ticket owner.", flags: 64 });

          await interaction.channel.setTopic(`🚫 User ${ticketOwner.user.tag} banned from tickets`);
          return interaction.reply({ content: `🚫 ${ticketOwner.user.tag} banned from creating tickets.`, flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: "❌ Failed to ban user.", flags: 64 });
        }
      }

      // SET PRIORITY
      if (action === "ticket_priority") {
        const priorityMenu = new StringSelectMenuBuilder()
          .setCustomId("priority_select")
          .setPlaceholder("Select priority level")
          .addOptions([
            { label: "🟢 Low", value: "low", description: "low priority" },
            { label: "🟡 Medium", value: "medium", description: "medium priority" },
            { label: "🟠 High", value: "high", description: "high priority" },
            { label: "🔴 Urgent", value: "urgent", description: "urgent priority" }
          ]);

        return interaction.reply({ content: "Select ticket priority:", components: [new ActionRowBuilder().addComponents(priorityMenu)], flags: 64 });
      }

      // ARCHIVE TICKET
      if (action === "ticket_archive") {
        try {
          const archiveCategoryId = "1449808642885947554";
          const archiveCategory = interaction.guild.channels.cache.get(archiveCategoryId);

          if (!archiveCategory) return interaction.reply({ content: "❌ Archive category not found.", flags: 64 });

          await interaction.channel.setParent(archiveCategoryId);
          await interaction.channel.send("📦 This ticket has been archived.");
          return interaction.reply({ content: "✅ Ticket archived.", flags: 64 });
        } catch (error) {
          console.error(error);
          return interaction.reply({ content: "❌ Failed to archive ticket.", flags: 64 });
        }
      }
    }

    // ───────────── HANDLE PRIORITY SELECT
    if (interaction.isStringSelectMenu() && interaction.customId === "priority_select") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 No permission.", flags: 64 });
      }

      const priority = interaction.values[0];
      const emoji = { low: "🟢", medium: "🟡", high: "🟠", urgent: "🔴" };

      await interaction.channel.setTopic(`Priority: ${emoji[priority]} ${priority.toUpperCase()}`);
      return interaction.update({ content: `✅ Priority set to ${emoji[priority]} **${priority.toUpperCase()}**`, components: [] });
    }

    // ───────────── HANDLE ADD USER MODAL
    if (interaction.isModalSubmit() && interaction.customId === "add_user_modal") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 No permission.", flags: 64 });
      }

      const userId = interaction.fields.getTextInputValue("user_id");

      try {
        const user = await interaction.guild.members.fetch(userId);
        await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        await interaction.channel.send(`✅ ${user} added to ticket.`);
        return interaction.reply({ content: `✅ Added ${user.user.tag}.`, flags: 64 });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: "❌ Could not find user.", flags: 64 });
      }
    }

    // ───────────── HANDLE REMOVE USER MODAL
    if (interaction.isModalSubmit() && interaction.customId === "remove_user_modal") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 No permission.", flags: 64 });
      }

      const userId = interaction.fields.getTextInputValue("user_id");

      try {
        const user = await interaction.guild.members.fetch(userId);
        await interaction.channel.permissionOverwrites.delete(user.id);
        await interaction.channel.send(`✅ ${user} removed from ticket.`);
        return interaction.reply({ content: `✅ Removed ${user.user.tag}.`, flags: 64 });
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: "❌ Could not find user.", flags: 64 });
      }
    }
    // ───────────── HANDLE DELIVERY MODAL (ADD THIS WITH OTHER MODAL HANDLERS) ─────────────

    if (interaction.isModalSubmit() && interaction.customId === "delivery_modal") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 No permission.", flags: 64 });
      }

      const deliveryLink = interaction.fields.getTextInputValue("delivery_link");
      const orderItems = interaction.fields.getTextInputValue("order_items");

      // Find ticket owner
      const ticketOwnerId = interaction.channel.topic?.match(/Owner: (\d+)/)?.[1];
      let ticketOwner = ticketOwnerId ? interaction.guild.members.cache.get(ticketOwnerId) : null;

      // Fallback: try to find from channel name
      if (!ticketOwner) {
        const ticketOwnerName = interaction.channel.name.replace('ticket-', '');
        ticketOwner = interaction.guild.members.cache.find(m => 
          m.user.username.toLowerCase() === ticketOwnerName.toLowerCase()
        );
      }

      if (!ticketOwner) {
        return interaction.reply({ content: "❌ Could not find ticket owner.", flags: 64 });
      }

      try {
        // Get order details from modal (you'll need to add this to the modal)
        const deliveryButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("delivery_disabled")
              .setLabel("˚ִִ 𓏼 ͜͜✚ྀ⊹")
              .setStyle(2) // Secondary (gray)
              .setDisabled(true),
            new ButtonBuilder()
              .setLabel("⠀") // Blank label (zero-width space for completely blank)
              .setStyle(5) // Link button
              .setURL(deliveryLink)
          );

        const deliveryMessage = `˚ ．𓉯ྀ⑅┊𓂅 s**p**__e__c**i**a**l**  d**e**__l**i**v**e**r__**y** ⁺⸺ ${ticketOwner} ˚ִִ 𓏼 ͜͜✚ྀ⊹𓈒
    ⠀ ⠀ /ᐠ > . < ̥マ 𓏼 ₊ ͜
    ⠀ ꒰৮ ྐ✚ ₊　you｡ ordered ⠀ ♡︎ ༷݁ ꒱ྀ
    ꒷꒦ ͜ ¦𓏵 ᭪ ${orderItems}
    𓉸ྀི 𓂃˚ open｡ ticket if broken ྀི ͡ ̣̣̣ ׁ ︶`;

        await ticketOwner.send({
          content: deliveryMessage,
          components: [deliveryButtons]
        });

        await interaction.channel.send(`✅ Delivery sent to ${ticketOwner.user.tag}!`);
        return interaction.reply({ content: `✅ Delivery message sent to ${ticketOwner.user.tag}.`, flags: 64 });
      } catch (error) {
        console.error("Delivery send error:", error);

        if (error.code === 50007) {
          return interaction.reply({ 
            content: "❌ Cannot send DM to this user. They may have DMs disabled.", 
            flags: 64 
          });
        }

        return interaction.reply({ 
          content: "❌ Failed to send delivery message.", 
          flags: 64 
        });
      }
    }


    // ───────────── HANDLE RECEIPT MODAL
    if (interaction.isModalSubmit() && interaction.customId === "receipt_modal") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 No permission.", flags: 64 });
      }

      const order = interaction.fields.getTextInputValue("order");
      const mop = interaction.fields.getTextInputValue("mop");
      const revisions = interaction.fields.getTextInputValue("revisions");
      const dates = interaction.fields.getTextInputValue("dates");
      const [startdate, enddate] = dates.split('|').map(d => d.trim());

      const ticketOwnerId = interaction.channel.topic?.match(/Owner: (\d+)/)?.[1];
      const ticketOwner = ticketOwnerId ? interaction.guild.members.cache.get(ticketOwnerId) : null;

      if (!ticketOwner) return interaction.reply({ content: "❌ Could not find ticket owner.", flags: 64 });

      const formattedOrder = order.trim().split(/\n+/).map(line => line.trim() ? `> ${line.trim()}` : '>').join('\n');

      const receipt = `_ _ 　  ✦　　.　　𓂀　　.　　✧
    _ _　 　꒰ ◜　\`🧾\`　◝ ꒱　⁺　**${ticketOwner}**'s ◟
    _ _　         ◍　˚  \`💬\`　࿓　order receipt
    _ _ 　  ˚　　 .　 　\`📦\`　　˚　 　 .　　 ˚
    _ _　   ⨀ 𓄹 ⨀　⏑⏑　overall　**order**
    ${formattedOrder}

    _ _　   · 𐙚 ·´　\`📝\`　｡　Ⴢ　revisions: ${revisions}
    _ _　　 ⁺　\`🐾\`　𓐆　˚　ฅ　payment: ${mop}
    _ _ 　  ˚　　 .　 　\`🪾\`　　˚　 　 .　　 ˚
-# _ _　　꙳ 𓊝 ꙳　date started: ${startdate}
-# _ _　　꙳ 𓆸 ꙳　date finished: ${enddate}
    _ _ 　  ✿　　.　　✦　　.　　˚`;

      const recChannel = interaction.guild.channels.cache.get(RECEIPT_CHANNEL_ID);
      if (recChannel?.isTextBased()) await recChannel.send({ content: receipt });

      await interaction.channel.send({ content: receipt });
      return interaction.reply({ content: "✅ Receipt sent!", flags: 64 });
    }
  
    // ───────────── /prices
    if (interaction.isChatInputCommand() && interaction.commandName === "prices") {
      const menu = new StringSelectMenuBuilder()
        .setCustomId("price_menu")
        .setPlaceholder(" 　　૮꒰ྀི ᴗ͈ . ᴗ͈ ∩꒱აྀི ˚ ⊹𓏼 payments ୧ ཾ ֪ | ͜͝ || ͜͝ |")
        .addOptions([
          { 
            label: "⃟", 
            description: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ 1 ⠀﹒ ⠀c@shapp⠀⠀ྀིྀ", 
            value: "cashapp" 
          },
          { 
            label: "⃟", 
            description: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ 2 ⠀﹒ ⠀nitro⠀⠀ྀིྀ", 
            value: "nitro" 
          },
          { 
            label: "⃟", 
            description: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ 3 ⠀﹒ ⠀rbx⠀⠀ྀིྀ", 
            value: "robux" 
          },
          { 
            label: "⃟", 
            description: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ 0⠀﹒ ⠀add-ons⠀⠀ྀིྀ", 
            value: "addons" 
          },
        ]);

      await interaction.channel.send({ 
        components: [new ActionRowBuilder().addComponents(menu)] 
      });

      return interaction.reply({ content: "✅ Dropdown sent!", ephemeral: true });
    }

    // ───────────── Handle /prices Menu Selections
    if (interaction.isStringSelectMenu() && interaction.customId === "price_menu") {
      const color = "#36393f";
      const embeds = {
        cashapp: `
ticket command: $3
complex ticket: $5
waitlist: $1
complex waitlist: $5
embeds: $3 
greet: $1
complex greet: $3
simple status: $1
complex status: $3

-# any module not listed: negotiable

interactive carrds
maximal: $5
minimal: $3
$0.50 per page

non-interactive carrds
minimal: $1
maximal: $3+

-# must have inspo or tut`,
        nitro: `
ticket command: nbsc
complex ticket: nbst (*)
waitlist: nbsc
complex waitlist: nbst (*)
embeds: nbsc 
greet: nbsc
complex greet: nbsc
simple status: nbsc
complex status: deco (*)

-# (*) - negotiable if bundled
-# any module not listed: negotiable

interactive carrds
maximal: nbst
minimal: nbsc
max: 3 pgs

non-interactive carrds
minimal: nbsc
maximal: nbsc +

-# must have inspo or tut`,
        robux: `
ticket command: 240 rbx
complex ticket: 500 rbx
waitlist: 100 rbx
complex waitlist: 500 rbx
embeds: 240 rbx 
greet: 100 rbx
complex greet: 240 rbx
simple status: 100 rbx
complex status: 240 rbx

-# any module not listed: negotiable

interactive carrds
maximal: 4–500 rbx
minimal: 240 rbx
80 rbx per page

non-interactive carrds
minimal: 100 rbx
maximal: 240 rbx

-# must have inspo or tut`,
        addons: `
rush fee: $5, 500 rbx, or dcr
priority: $3, 240 rbx, or nbsc
extra revisions: $1 after your 3rd
-# I will make you aware of the add-ons`,
      };

      const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(embeds[interaction.values[0]]);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (err) {
    console.error(err);
  }
});

// ═══════════════════════════════════════════════════════════
// 📨 MESSAGE LISTENER FOR AUTORESPONDERS
// ═══════════════════════════════════════════════════════════
client.on("messageCreate", async message => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check each autoresponder
  for (const [trigger, data] of autoresponders) {
    // Skip if disabled
    if (!data.enabled) continue;

    const messageContent = message.content.toLowerCase();
    let shouldRespond = false;

    // Check if trigger matches
    if (data.exactMatch) {
      // Exact match: message must be exactly the trigger
      shouldRespond = messageContent === trigger;
    } else {
      // Contains match: message must contain the trigger
      shouldRespond = messageContent.includes(trigger);
    }

    if (shouldRespond) {
      try {
        // Delete trigger message if configured
        if (data.deleteTrigger && message.deletable) {
          await message.delete().catch(console.error);
        }

        // Send response
        await message.channel.send(data.response);

        // Only respond to first matching trigger
        break;
      } catch (error) {
        console.error("Error in autoresponder:", error);
      }
    }
  }
});
// ───────────────────────────────
// 💌 Welcomer
// ───────────────────────────────
client.on("guildMemberAdd", async member => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    const welcomeText = `-# _ _ ˚ ．𓉯ྀ⑅┊𓂅 w**e**__lco__m**e** ⁺⸺ ${member} ˚ִִ 𓏼 ͜͜✚ྀ⊹𓈒 ͜͝ | ͜͝ |\n⠀ ⠀ _ _`;


    const embed1 = new EmbedBuilder()
      .setColor(0x36393f)
      .setDescription(
        `⠀ ⠀ ⠀/ᐠ > . < ̥マ ݂۫ 𓏼 ₊ ͜ ◞ ྀིྀ\n⠀ ⠀ ꒰৯ ྐ✚ ₊　[tos](https://discord.com/channels/1427657617333026868/1428147471435038730)　+　[revw](https://discord.com/channels/1427657617333026868/1428394657762775191) ⠀ ♡︎ ༷݁ ꒱ྀ\n_ _　　꒷꒦ ͜ ¦𓏵 ᭪ [ask](https://discord.com/channels/1427657617333026868/1428392518168477747)｡ questions 𓏼 ͡ ⑅ ♡\n_ _　　　𓉸ྀི 𓂃˚ [exm](https://discord.com/channels/1427657617333026868/1428536539020918805) / [price](https://discord.com/channels/1427657617333026868/1428156228634411038) + [order](https://discord.com/channels/1427657617333026868/1428394803527290900) ྀི ͡ ̣̣̣ ׁ ︶`
      )
      .setThumbnail("https://cdn.discordapp.com/attachments/1439498545106259969/1449783661724434474/download_1.gif?ex=694027c0&is=693ed640&hm=b5faa1e0aeece6c5de4e4559fdcc4c179adeaa6035c188ce007f6e6a4fbb7637&")
      .setImage("https://media.tenor.com/neRZrojlfIcAAAAi/divider-aesthetic.gif")
      ;

    const embed2 = new EmbedBuilder()
      .setColor(0x36393f)
      .setImage("https://cdn.discordapp.com/attachments/1439498545106259969/1449783269267607571/ezgif.com-crop.gif?ex=69402763&is=693ed5e3&hm=17e1300ac633e43b185b0579f30295c9934f5fdd66ca32a6d6be8744d7136fb6&");

    await channel.send({ content: welcomeText, embeds: [embed1, embed2] });
  } catch (err) {
    console.error("Error in welcomer:", err);
  }
});

client.login(token);
