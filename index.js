// ───────────────────────────────
// 🧩 Imports and setup
// ───────────────────────────────
import dotenv from "dotenv";
dotenv.config();

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
    activities: [{ name: "my beautiful treasures", type: 3 }],
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
    }


    // ───────────── HANDLE SELECT MENU
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
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          { id: staffRoleId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle("Thank you for opening a ticket!")
        .setDescription("> Hi! A staff member will be with you shortly.\nType `.start` to begin.")
        .addFields({ name: "Customer", value: `<@${interaction.user.id}>`, inline: true })
        .setColor(0x36393f)
        .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png");

      const closeButton = new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        content: `<@&${staffRoleId}> <@${interaction.user.id}>`,
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({ 
        content: `✅ Ticket created: ${ticketChannel}`, 
        flags: 64 
      });
    }


    // ───────────── CLOSE BUTTON WITH TRANSCRIPT
    if (interaction.isButton() && interaction.customId === "ticket_close") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You don't have permission to close this ticket.", 
          flags: 64
        });
      }

      await interaction.reply({ 
        content: "📝 Generating transcript and closing ticket...", 
        flags: 64
      });

      try {
        // Fetch ALL messages from the ticket channel
        let allMessages = [];
        let lastMessageId;

        // Keep fetching messages in batches of 100 until we have them all
        while (true) {
          const options = { limit: 100 };
          if (lastMessageId) {
            options.before = lastMessageId;
          }

          const messages = await interaction.channel.messages.fetch(options);
          if (messages.size === 0) break;

          allMessages.push(...messages.values());
          lastMessageId = messages.last().id;

          // If we got less than 100 messages, we've reached the end
          if (messages.size < 100) break;
        }

        const sortedMessages = allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

        // Generate HTML transcript
        const escapeHtml = (text) => {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        };

        let transcript = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Transcript - ${interaction.channel.name}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }

            .container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }

            .header h1 {
                font-size: 28px;
                margin-bottom: 10px;
            }

            .header-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
                text-align: left;
            }

            .info-item {
                background: rgba(255,255,255,0.1);
                padding: 12px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
            }

            .info-label {
                font-size: 12px;
                opacity: 0.9;
                margin-bottom: 5px;
            }

            .info-value {
                font-size: 16px;
                font-weight: 600;
            }

            .messages {
                padding: 30px;
            }

            .message {
                margin-bottom: 20px;
                animation: fadeIn 0.3s ease-in;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .message-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                margin-right: 12px;
                flex-shrink: 0;
            }

            .message-info {
                flex: 1;
            }

            .username {
                font-weight: 600;
                color: #2c3e50;
                font-size: 15px;
            }

            .timestamp {
                font-size: 12px;
                color: #95a5a6;
                margin-left: 8px;
            }

            .message-content {
                margin-left: 52px;
                padding: 12px 16px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 3px solid #667eea;
                color: #2c3e50;
                line-height: 1.6;
                word-wrap: break-word;
            }

            .embed {
                margin-left: 52px;
                margin-top: 8px;
                padding: 12px 16px;
                background: #e8f4f8;
                border-radius: 8px;
                border-left: 3px solid #3498db;
                font-size: 14px;
                color: #34495e;
            }

            .embed-title {
                font-weight: 600;
                margin-bottom: 5px;
            }

            .attachment {
                margin-left: 52px;
                margin-top: 8px;
                padding: 10px 14px;
                background: #fff3cd;
                border-radius: 8px;
                border-left: 3px solid #ffc107;
                font-size: 13px;
            }

            .attachment a {
                color: #856404;
                text-decoration: none;
                font-weight: 500;
            }

            .attachment a:hover {
                text-decoration: underline;
            }

            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #dee2e6;
            }

            .bot-tag {
                display: inline-block;
                background: #5865f2;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                margin-left: 6px;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 Ticket Transcript</h1>
                <div class="header-info">
                    <div class="info-item">
                        <div class="info-label">Ticket Channel</div>
                        <div class="info-value">${escapeHtml(interaction.channel.name)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Closed By</div>
                        <div class="info-value">${escapeHtml(interaction.user.tag)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Closed At</div>
                        <div class="info-value">${new Date().toLocaleString()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Messages</div>
                        <div class="info-value">${sortedMessages.size}</div>
                    </div>
                </div>
            </div>

            <div class="messages">`;

        sortedMessages.forEach(msg => {
          const timestamp = new Date(msg.createdTimestamp).toLocaleString();
          const avatarLetter = msg.author.username.charAt(0).toUpperCase();
          const botTag = msg.author.bot ? '<span class="bot-tag">BOT</span>' : '';

          transcript += `
                <div class="message">
                    <div class="message-header">
                        <div class="avatar">${avatarLetter}</div>
                        <div class="message-info">
                            <span class="username">${escapeHtml(msg.author.username)}${botTag}</span>
                            <span class="timestamp">${timestamp}</span>
                        </div>
                    </div>`;

          if (msg.content) {
            transcript += `
                    <div class="message-content">${escapeHtml(msg.content)}</div>`;
          }

          if (msg.embeds.length > 0) {
            msg.embeds.forEach(embed => {
              transcript += `
                    <div class="embed">
                        <div class="embed-title">📎 Embed${embed.title ? ': ' + escapeHtml(embed.title) : ''}</div>
                        ${embed.description ? '<div>' + escapeHtml(embed.description.substring(0, 200)) + '...</div>' : ''}
                    </div>`;
            });
          }

          if (msg.attachments.size > 0) {
            msg.attachments.forEach(att => {
              transcript += `
                    <div class="attachment">
                        📎 <a href="${att.url}" target="_blank">${escapeHtml(att.name)}</a>
                    </div>`;
            });
          }

          transcript += `
                </div>`;
        });

        transcript += `
            </div>

            <div class="footer">
                Generated by Discord Ticket System • ${new Date().toLocaleString()}
            </div>
        </div>
    </body>
    </html>`;

        // Create buffer for file upload
        const buffer = Buffer.from(transcript, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { 
          name: `transcript-${interaction.channel.name}-${Date.now()}.html` 
        });

        // Send transcript to a log channel (replace with your log channel ID)
        const logChannelId = "1445580720839069696"; // Set this to your transcript log channel
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        if (logChannel) {
          const transcriptEmbed = new EmbedBuilder()
            .setTitle("📋 Ticket Closed")
            .setDescription(`Ticket: ${interaction.channel.name}\n\n**[Click here to view transcript](attachment://transcript-${interaction.channel.name}-${Date.now()}.html)**`)
            .addFields(
              { name: "Closed by", value: `${interaction.user.tag}`, inline: true },
              { name: "Messages", value: `${sortedMessages.length}`, inline: true },
              { name: "Date", value: `${new Date().toLocaleString()}`, inline: true }
            )
            .setColor(0xff0000)
            .setFooter({ text: "💡 Download the HTML file and open it in your browser to view the full transcript" })
            .setTimestamp();

          await logChannel.send({ 
            embeds: [transcriptEmbed], 
            files: [attachment] 
          });
        }

        // Delete the ticket channel after a delay
        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 3000);

      } catch (error) {
        console.error("Error generating transcript:", error);
        await interaction.followUp({ 
          content: "⚠️ Error generating transcript, but closing ticket anyway...", 
          flags: 64 
        });

        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 3000);
      }
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
// ───────────────────────────────
// 💌 Welcomer
// ───────────────────────────────
client.on("guildMemberAdd", async member => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel?.isTextBased()) return;

    const welcomeText = `_ _ ˚ ．𓉯ྀ⑅┊𓂅 w**e**__lco__m**e** ⁺⸺ ${member} ˚ִִ 𓏼 ͜͜✚ྀ⊹𓈒 ͜͝ | ͜͝ |\n⠀ ⠀ _ _`;


    const embed1 = new EmbedBuilder()
      .setColor(0x36393f)
      .setDescription(
        `⠀ ⠀ ⠀/ᐠ > . < ̥マ ݂۫ 𓏼 ₊ ͜ ◞ ྀིྀ\n⠀ ⠀ ꒰৯ ྐ✚ ₊　[tos](https://discord.com/channels/1427657617333026868/1428147471435038730)　+　[revw](https://discord.com/channels/1427657617333026868/1428394657762775191) ⠀ ♡︎ ༷݁ ꒱ྀ\n_ _　　꒷꒦ ͜ ¦𓏵 ᭪ [ask](https://discord.com/channels/1427657617333026868/1428392518168477747)｡ questions 𓏼 ͡ ⑅ ♡\n_ _　　　𓉸ྀི 𓂃˚ [exm](https://discord.com/channels/1427657617333026868/1428536539020918805) / [price](https://discord.com/channels/1427657617333026868/1428156228634411038) + [order](https://discord.com/channels/1427657617333026868/1428394803527290900) ྀི ͡ ̣̣̣ ׁ ︶`
      )
      .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png");

    const embed2 = new EmbedBuilder()
      .setColor(0x36393f)
      .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428556895890968616/94927758da49e22d1584f9dd766d8345.jpg");

    await channel.send({ content: welcomeText, embeds: [embed1, embed2] });
  } catch (err) {
    console.error("Error in welcomer:", err);
  }
});

client.login(token);
