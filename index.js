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
    .setName("ticketbutton")
    .setDescription("Create a ticket panel with up to 3 buttons")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("color1").setDescription("Color for Button 1").setRequired(true))
    .addStringOption(o => o.setName("label1").setDescription("Label for Button 1"))
    .addStringOption(o => o.setName("emoji1").setDescription("Emoji for Button 1"))
    .addChannelOption(o => o.setName("category1").setDescription("Category for Button 1").addChannelTypes(ChannelType.GuildCategory))
    .addStringOption(o => o.setName("color2").setDescription("Color for Button 2"))
    .addStringOption(o => o.setName("label2").setDescription("Label for Button 2"))
    .addStringOption(o => o.setName("emoji2").setDescription("Emoji for Button 2"))
    .addChannelOption(o => o.setName("category2").setDescription("Category for Button 2").addChannelTypes(ChannelType.GuildCategory))
    .addStringOption(o => o.setName("color3").setDescription("Color for Button 3"))
    .addStringOption(o => o.setName("label3").setDescription("Label for Button 3"))
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
    .addStringOption(o => o.setName("mop").setDescription("Method of payment").setRequired(true))
    .addStringOption(o => o.setName("amount").setDescription("Quantity ordered").setRequired(true)),

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

    // ───────────── /waitlist - WAITLIST STATUS MENU
    if (interaction.isStringSelectMenu() && interaction.customId === "wait_status") {
      const selected = interaction.values[0];
      const updatedContent = interaction.message.content.replace(/pending|waiting|processing/i, selected);
      const components = selected === "complete" ? [] : interaction.message.components;
      return interaction.update({ content: updatedContent, components });
    }

    // ───────────── /waitlist Command
    if (interaction.isChatInputCommand() && interaction.commandName === "waitlist") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You do not have permission to use this command.", 
          ephemeral: true 
        });
      }

      const wlChannel = interaction.guild.channels.cache.get(WL_ID);
      if (!wlChannel?.isTextBased()) {
        return interaction.reply({ 
          content: "❌ Waitlist channel not found.", 
          ephemeral: true 
        });
      }

      const user = interaction.options.getUser("user");
      const item = interaction.options.getString("item");
      const mop = interaction.options.getString("mop");
      const amount = interaction.options.getString("amount");

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("wait_status")
          .setPlaceholder("⠀ ⠀ ⠀/ᐠ > . < ̥マ    ݂۫   status  𓏼 ₊      ͜  ◞ ྀིྀ")
          .addOptions(
            { 
              label: "⃟", 
              value: "paid", 
              description: "𓏵۪۪　﹒　　 paid　𓏼", 
              emoji: { id: "1445921537340211242", name: "cuursor", animated: true } 
            },
            { 
              label: "⃟", 
              value: "processing", 
              description: "𓏫　⌣　　﹕　processing　𓈒　 ͝ །⠀⠀", 
              emoji: { id: "1445919743788978367", name: "cross" } 
            },
            { 
              label: "⃟", 
              value: "complete", 
              description: "◟ ͜  ︵◞◟　　﹕　complete　𓂃𓏼⁾⁾", 
              emoji: { id: "1445921420327653417", name: "arr", animated: true } 
            }
          )
      );

      await wlChannel.send({
        embeds: [{
          image: { 
            url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png?ex=69322056&is=6930ced6&hm=379f1c2c9ce4024093bd802d9d90b3473aad84731d11e7ee6bb8031caea39ac4&" 
          }
        }]
      });

      await wlChannel.send({
        embeds: [{
          image: { 
            url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927468182667274/ecc8bc2b4d4847f9e7f0daeaffc3605e.jpg?ex=69322064&is=6930cee4&hm=5585bd4a9b1ccbb4365ea92e7305d68bcef2fbb067e89bbca6862adc48d2443d&" 
          }
        }]
      });

      await wlChannel.send({
        content: `_ _ 　  ✦　　.　　𓂀　　.　　✧ 
_ _　 　꒰ ◜　\`💉\`　◝ ꒱　⁺　${user.username}'s ◟
_ _　         ◍　˚  \`💬\`　࿓　queue spot 
_ _ 　  ˚　　 .　 　\`💀\`　　˚　 　 .　　 ˚ 
_ _　   ⨀ 𓄹 ⨀　⏑⏑　user's　**order** 
_ _　   · 𐙚 ·´　\`🕸\`　｡　Ⴢ　item: ${item} 
_ _　　 ⁺　\`🦴\`　𓐆　˚　ฅ　amount: ${amount}
_ _　　 ⁺　\`🩸\`　𓐆　˚　ฅ　payment: ${mop} 
_ _ 　  ˚　　 .　 　\`🗯\`　　˚　 　 .　　 ˚ 
_ _　　꙳ 𓊝 ꙳　**status**: pending 
_ _ 　  ✿　　.　　✦　　.　　˚ 
`,
        components: [row],
        embeds: [{
          image: { 
            url: "https://cdn.discordapp.com/attachments/1439498545106259969/1445927408778739892/ei_1764806262011-removebg-preview.png?ex=69322056&is=6930ced6&hm=379f1c2c9ce4024093bd802d9d90b3473aad84731d11e7ee6bb8031caea39ac4&" 
          }
        }]
      });

      return interaction.reply({ content: "✅ Order added to waitlist!", ephemeral: true });
    }

    // ───────────── Update Waitlist Buttons
    if (interaction.isButton() && ["status_paid", "status_processing", "status_done"].includes(interaction.customId)) {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You cannot update this.", 
          ephemeral: true 
        });
      }

      const status = {
        status_paid: "paid",
        status_processing: "processing",
        status_done: "done",
      }[interaction.customId];

      const updated = interaction.message.content.replace(/status:\s*\w+/i, `status: ${status}`);

      let components = interaction.message.components;
      if (status === "done") {
        components = interaction.message.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = newRow.components.map(b => ButtonBuilder.from(b).setDisabled(true));
          return newRow;
        });
      }

      await interaction.message.edit({ content: updated, components });
      return interaction.reply({ 
        content: `✅ Status updated to **${status}**.`, 
        ephemeral: true 
      });
    }

    // ───────────── /ticketbutton
    if (interaction.isChatInputCommand() && interaction.commandName === "ticketbutton") {
      const buttons = [];
      const buttonCategories = {};

      for (let i = 1; i <= 3; i++) {
        const color = interaction.options.getString(`color${i}`);
        const label = interaction.options.getString(`label${i}`);
        const emoji = interaction.options.getString(`emoji${i}`);
        const category = interaction.options.getChannel(`category${i}`);

        if (i === 1 && !color) {
          return interaction.reply({ 
            content: "Button 1 must have a color!", 
            ephemeral: true 
          });
        }

        if (!color && !label && !emoji) continue;

        const style = validStyles[color?.toLowerCase()] || ButtonStyle.Primary;
        const btn = new ButtonBuilder()
          .setCustomId(`ticket_create_${i}`)
          .setLabel(label || `Ticket ${i}`)
          .setStyle(style);

        if (emoji) btn.setEmoji(emoji);
        buttons.push(btn);

        if (category) buttonCategories[`ticket_create_${i}`] = category.id;
      }

      if (!buttons.length) {
        return interaction.reply({ 
          content: "No buttons were configured!", 
          ephemeral: true 
        });
      }

      const row = new ActionRowBuilder().addComponents(buttons);
      interaction.client.ticketButtonCategories = buttonCategories;

      await interaction.reply({ content: "✅ Ticket panel sent!", ephemeral: true });
      await interaction.channel.send({ components: [row] });
    }

    // ───────────── Ticket Create
    if (interaction.isButton() && interaction.customId.startsWith("ticket_create_")) {
      const categoryId = interaction.client.ticketButtonCategories?.[interaction.customId];
      if (!categoryId) {
        return interaction.reply({ 
          content: "No category set for this button.", 
          ephemeral: true 
        });
      }

      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
      );

      if (existing) {
        return interaction.reply({ 
          content: "❌ You already have a ticket!", 
          ephemeral: true 
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
        parent: categoryId,
        permissionOverwrites: [
          { 
            id: interaction.guild.roles.everyone, 
            deny: ["ViewChannel"] 
          },
          { 
            id: interaction.user.id, 
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] 
          },
          { 
            id: staffRoleId, 
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] 
          },
        ],
      });

      const staffRole = interaction.guild.roles.cache.get(staffRoleId);
      const embed = new EmbedBuilder()
        .setTitle("thank you for opening a ticket!")
        .setDescription("> _ _  hi there! a staff member will be here soon!\n type `.start` to begin!")
        .addFields({ 
          name: "customer", 
          value: `<@${interaction.user.id}>`, 
          inline: true 
        })
        .setColor(0x36393f)
        .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png?ex=68f3cea1&is=68f27d21&hm=715e94744bb7c42a3289fc6dade894ba354d6b1cf0056b6a6ff0a6b83ef2da17");

      const closeButton = new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ 
        content: `${staffRole} <@${interaction.user.id}>`, 
        embeds: [embed], 
        components: [row] 
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: `✅ Ticket created: ${ticketChannel}`, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: `✅ Ticket created: ${ticketChannel}`, 
          ephemeral: true 
        });
      }
    }

    // ───────────── Ticket Close
    if (interaction.isButton() && interaction.customId === "ticket_close") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ 
          content: "🚫 You don't have permission to close this ticket.", 
          ephemeral: true 
        });
      }

      await interaction.reply({ 
        content: "🗑️ Closing ticket in 3 seconds...", 
        ephemeral: true 
      });

      setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
    }

    // ───────────── /prices
    if (interaction.isChatInputCommand() && interaction.commandName === "prices") {
      const menu = new StringSelectMenuBuilder()
        .setCustomId("price_menu")
        .setPlaceholder(" 　　૮꒰ྀི ᴗ͈ . ᴗ͈ ∩꒱აྀི ˚ ⊹𓏼 payments ୧ ཾ ֪ | ͜͝ || ͜͝ |")
        .addOptions([
          { 
            label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ one ⠀﹒ ⠀c@shapp⠀⠀ྀིྀ", 
            description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", 
            value: "cashapp" 
          },
          { 
            label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ two ⠀﹒ ⠀nitro ⠀⠀ྀིྀ", 
            description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", 
            value: "nitro" 
          },
          { 
            label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ three⠀﹒ ⠀robux ⠀⠀ྀིྀ", 
            description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", 
            value: "robux" 
          },
          { 
            label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ four ⠀﹒ ⠀add-ons ⠀⠀ྀིྀ", 
            description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", 
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
