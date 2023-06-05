const { SlashCommandBuilder, Component, ButtonComponent, MessageComponentType} = require('discord.js');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const { ComponentType } = require('discord.js');
const { Permissions } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pagersystem')
		.setDescription('Pager sistemini kullanmanızı sağlar.')
		.addRoleOption(option =>
			option
				.setName('unit')
				.setDescription('Bildirimi göndermek istediğiniz spesifik bir polis birimi belirtin.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('location')
				.setDescription('Olay yerinin konumunu belirtin.')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('situation')
				.setDescription('Yönelecek olan polis birimleri için olay hakkında bilgi verin.')
				.setRequired(true)),

	async execute(interaction) {
		const allowedChannelName = "pager";
		const channelName = interaction.channel.name;
		const unit = interaction.options.getRole('unit') ?? 'N/A';
		const location = interaction.options.getString('location') ?? 'N/A';
		const situation = interaction.options.getString('situation') ?? 'N/A';

		if (channelName !== allowedChannelName) {
			await interaction.reply({ content: `Bu komutu sadece "${allowedChannelName}" kanalında kullanabilirsiniz.`, ephemeral: true });
			return;
		}


		const pagerEmbed = new EmbedBuilder()
			.setColor("#b20606")
			.setAuthor({ name: 'LSPD PAGER SYSTEM', iconURL: 'https://i.imgur.com/w6Kdktt.png', url: 'https://lspd-tr.gta.world/' })
			.addFields(
				{ name: 'Konum Bilgisi', value: `|| ${location} ||`, inline: false },
				{ name: 'Durum', value: `|| ${situation} ||`, inline: false },
				{ name: 'Çağrıyı Yanıtlayanlar', value: 'N/A', inline: false },
			)
			.setTimestamp()

		let confirmID = `join_call_${uuidv4()}`
		let leaveID = `leave_call_${uuidv4()}`
		let supervisorID = `supervisor_${uuidv4()}`
        let adminID = `admin_${uuidv4()}`

		let confirm = new ButtonBuilder()
			.setCustomId(confirmID)
			.setLabel('Çağrıya Yönel')
			.setStyle(ButtonStyle.Success);

		let cancel = new ButtonBuilder()
			.setCustomId(leaveID)
			.setLabel('Çağrıdan Ayrıl')
			.setStyle(ButtonStyle.Primary);

		let supervisor = new ButtonBuilder()
			.setCustomId(supervisorID)
			.setLabel('İptal Et')
			.setStyle(ButtonStyle.Danger);
            
        let admin = new ButtonBuilder()
			.setCustomId(adminID)
			.setLabel('(( Sil ))')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(confirm, cancel, supervisor, admin);

		await interaction.reply({ allowedMentions: { roles: [unit.id] }, content: `<@&${unit.id}> birimleri için bir pager bildirimi gönderildi.`, embeds: [pagerEmbed], components: [row] });

		const filterr = (interaction) => interaction.customId === confirm.customId || interaction.customId === cancel.customId || interaction.customId === supervisor.customId;
		const colletor = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button ,filterr, time: 999999 });
		colletor.on('collect', async interaction => {
			const user = interaction.user;
			const nickname = interaction.member.nickname;
			const fullName = nickname ? nickname : user.username;
			const message = interaction.message

			let joinedPlayers = pagerEmbed.data.fields[2].value;
			const userAlreadyJoined = joinedPlayers.split('\n').includes(fullName);
			let interactionid = interaction.customId;
			console.log(interactionid)
			if (confirmID === interactionid) {
				if (userAlreadyJoined) {
					await interaction.reply({ content: 'Zaten çağrıya yöneldiğinizi bildirmişsiniz.', ephemeral: true });
				}else {
					if (joinedPlayers === 'N/A') {
						joinedPlayers = fullName;
					} else {
						joinedPlayers = joinedPlayers + '\n' + fullName;
					}
				}

				let field = pagerEmbed.data.fields[2];
				field.value = joinedPlayers;
				if(!userAlreadyJoined)
					await interaction.reply({ content: 'Çağrıya yöneldiğinizi bildirdik.', ephemeral: true });
			}
			else if (leaveID === interactionid) {
				if(!joinedPlayers.includes(fullName)) {
					await interaction.reply({ content: 'Çağrıya zaten yönelmemişsiniz.', ephemeral: true });
				}
				else {
					joinedPlayers = joinedPlayers.replace("\n"+fullName, '');
					joinedPlayers = joinedPlayers.replace(fullName, '');
					if(joinedPlayers.length < 1) joinedPlayers = 'N/A';
					let field = pagerEmbed.data.fields[2];
					field.value = joinedPlayers;
					await interaction.reply({ content: 'Çağrıya yönelmenizi iptal ettiğinizi bildirdik.', ephemeral: true });
				}
			}
			await message.edit({embeds: [pagerEmbed], components: [row]});

            const allowedRoles = ['Supervisory Staff', 'Lieutenants', 'Legal Faction Management', 'Admin', 'Command Staff'];

			if (supervisorID === interactionid) {
                const memberRoles = interaction.member.roles;
				const isAdmin = allowedRoles.some(roleName =>
                    memberRoles.cache.some(role => role.name === roleName)
                  );
                  const isReplyAuthor = interaction.user.id === interaction.message.interaction.user.id;
				if (isAdmin || isReplyAuthor) {
                    const nickname = interaction.member.nickname || interaction.user.username;
					const cancelMessage = `Bu pager bildirimi ${nickname} tarafından iptal/geçersiz olarak işaretlenmiştir.`;
					pagerEmbed.setFooter({ text: cancelMessage });
					colletor.stop()
					await interaction.message.edit({ embeds: [pagerEmbed], components: [] });
				} else	{
					await interaction.reply({ content: 'Bu işlemi gerçekleştirmek için yeterli izniniz yok.', ephemeral: true });
				}
			}

            if (adminID === interactionid) {
                const memberRoles = interaction.member.roles;
				const isAdmin = allowedRoles.some(roleName =>
                    memberRoles.cache.some(role => role.name === roleName)
                  );
                  const isReplyAuthor = interaction.user.id === interaction.message.interaction.user.id;
				if (isAdmin || isReplyAuthor) {
                    const nickname = interaction.member.nickname || interaction.user.username;
					const cancelMessage = `(( Bu pager bildirimi ${nickname} tarafından iptal/geçersiz olarak işaretlenmiştir. ))`;
					pagerEmbed.setFooter({ text: cancelMessage });
					colletor.stop()
					await interaction.message.edit({ embeds: [pagerEmbed], components: [] });
				} else	{
					await interaction.reply({ content: 'Bu işlemi gerçekleştirmek için yeterli izniniz yok.', ephemeral: true });
				}
			}


		})




	}
};