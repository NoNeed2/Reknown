function logMessage (Client, oldMessage, newMessage) {
  if (!oldMessage.content && !newMessage.content) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new Client.Discord.MessageEmbed()
    .setTitle('Message Edited')
    .setAuthor(`${oldMessage.author.tag} (${oldMessage.author.id})`, oldMessage.author.displayAvatarURL())
    .addField('Previous', oldMessage.content ? oldMessage.content.length > 1024 ? 'Over 1024 Char.' : oldMessage.content : 'None')
    .addField('After', newMessage.content ? newMessage.content.length > 1024 ? 'Over 1024 Char.' : newMessage.content : 'None')
    .addField('Channel', oldMessage.channel)
    .setColor(0x00FFFF)
    .setTimestamp();

  return require('../functions/sendlog.js')(Client, embed, oldMessage.guild.id);
}

function editMsg (Client, oldMessage, newMessage) {
  return Client.bot.emit('message', newMessage);
}

async function editStar (Client, oldMessage, newMessage) {
  if (newMessage.content || newMessage.attachments.size > 0) {
    const toggled = (await Client.sql.query('SELECT bool FROM togglestar WHERE guildid = $1 AND bool = $2', [newMessage.guild.id, 1])).rows[0];
    const cid = (await Client.sql.query('SELECT channelid FROM starchannel WHERE guildid = $1', [newMessage.guild.id])).rows[0];
    const msgRow = (await Client.sql.query('SELECT editid FROM star WHERE msgid = $1', [newMessage.id])).rows[0];
    if (toggled && msgRow) {
      const sChannel = newMessage.guild.channels.get(cid ? cid.channelid : null) || newMessage.guild.channels.find(c => c.name === 'starboard');
      if (!sChannel) return;

      const msg = await sChannel.messages.fetch(msgRow.editid);
      if (!msg) return;

      const embed = new Client.Discord.MessageEmbed(msg.embeds[0]);
      if (newMessage.content) embed.setDescription(newMessage.content);
      const img = newMessage.attachments.find(attch => attch.height);
      if (img) embed.setImage(img.proxyURL);
      return msg.edit(embed);
    } else Client.sql.query('DELETE FROM star WHERE msgid = $1', [newMessage.id]);
  }
}

module.exports = (Client) => {
  return Client.bot.on('messageUpdate', (oldMessage, newMessage) => {
    if (!oldMessage.guild || !oldMessage.guild.available) return;

    logMessage(Client, oldMessage, newMessage);
    editMsg(Client, oldMessage, newMessage);
    editStar(Client, oldMessage, newMessage);
  });
};
