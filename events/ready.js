const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setPresence({ activities: [{ name: 'tr.gta.world' }], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
	
};