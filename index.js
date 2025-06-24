const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const warnings = new Map();

client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
  const userId = message.author.id;

  // ========== حماية المنشن ==========
  const mentionedAdmins = message.mentions.members.some(member =>
    member.permissions.has(PermissionsBitField.Flags.Administrator)
  );

  if (!isAdmin && mentionedAdmins) {
    await message.delete().catch(() => {});
    warnings.set(userId, (warnings.get(userId) || 0) + 1);
    const count = warnings.get(userId);

    if (count === 1) {
      const warningEmbed = new EmbedBuilder()
        .setColor('Yellow')
       
        .setDescription(`📌 **لقد قمت بعمل منشن المرة القادمة سيتم إسكاتك** ⚠️<@${userId}>`)
        .setTimestamp();

      message.channel.send({ embeds: [warningEmbed] });
    } else {
      const muteRole = await ensureMuteRole(message.guild);
      await message.member.roles.add(muteRole).catch(() => {});

      const muteEmbed = new EmbedBuilder()
        .setColor('Red')
        
        .setDescription(`📌 **تم إسكاتك لمدة ساعة بسبب تكرار المنشن** ⚠️<@${userId}>`)
        .setTimestamp();

      message.channel.send({ embeds: [muteEmbed] });

      setTimeout(() => {
        message.member.roles.remove(muteRole).catch(() => {});
      }, 60 * 60 * 1000);
    }
    return;
  }

  // ========== حماية الروابط ==========
  const containsLink = /(https?:\/\/|discord\.gg)/i.test(message.content);
  if (!isAdmin && containsLink) {
    await message.delete().catch(() => {});
    warnings.set(userId, (warnings.get(userId) || 0) + 1);
    const count = warnings.get(userId);

    if (count === 1) {
      const warningEmbed = new EmbedBuilder()
        .setColor('Yellow')
        
        .setDescription(`📌 **الروابط ممنوعة, المرة القادمة سيتم إسكاتك** ⚠️<@${userId}>`)
        .setTimestamp();

      message.channel.send({ embeds: [warningEmbed] });
    } else {
      const muteRole = await ensureMuteRole(message.guild);
      await message.member.roles.add(muteRole).catch(() => {});

      const muteEmbed = new EmbedBuilder()
        .setColor('Red')
    
        .setDescription(`📌 **تم إسكاتك لمدة ساعة بسبب تكرار نشر الروابط** ⚠️<@${userId}>`)
        .setTimestamp();

      message.channel.send({ embeds: [muteEmbed] });

      setTimeout(() => {
        message.member.roles.remove(muteRole).catch(() => {});
      }, 60 * 60 * 1000);
    }
    return;
  }
});

// ========== إنشاء أو تحديث رتبة Mute ==========
async function ensureMuteRole(guild) {
  let muteRole = guild.roles.cache.find(role => role.name === 'Muted');
  if (!muteRole) {
    muteRole = await guild.roles.create({
      name: 'Muted',
      permissions: []
    });
  }

  // تعديل صلاحيات الرتبة في جميع القنوات
  guild.channels.cache.forEach(async (channel) => {
    try {
      await channel.permissionOverwrites.edit(muteRole, {
        SendMessages: false,
        AddReactions: false,
        Speak: false,
        Connect: false
      });
    } catch (err) {
      console.log(`⚠️ فشل في تعديل الصلاحيات في ${channel.name}`);
    }
  });

  return muteRole;
}


// 🔐 أدخل التوكن هنا
client.login(process.env.TOKEN);

