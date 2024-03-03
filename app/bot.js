const TelegramBot = require('node-telegram-bot-api');
class TGBot {
	constructor(_settings, _db, _logger) {
		this.logger = _logger;
		this.db = _db;
		this.settings = _settings;
		this.commands = _settings.locale.commands;
		this.bot;
		this.commandHandlers = [];	
		this.start();
		this.logger.log('Bot constructed', "info");
	}

	async start() {
		// check token
		this.logger.log(this.settings.locale.console.bot_token_verify_start, "info");
		if (!await this.verifyToken(this.settings.token)) {
			this.logger.log(this.settings.locale.console.bot_token_verify_fail, "error");
			return;
		}

		// create commands
		for (let command in this.settings.locale.commands) {
			if (Object.prototype.hasOwnProperty.call(this.commands, command)) {
				// Remove the slash from the command name
				let functionName = "cmd_" + command.slice(1);

				// Check if a function with this name exists in this class
				if (typeof this[functionName] === 'function'){
					// Bind the function to 'this' and store it along with the command name
					this.commandHandlers.push({command: command, handler: this[functionName].bind(this)});
					this.logger.log(command + this.settings.locale.console.bot_cmd_create_pass + this[functionName].name, "info");
				} else { this.logger.log(command + this.settings.locale.console.bot_cmd_func_404, "warning"); }				
			}
		}
		this.logger.log(`CommandHanlers:\n ${JSON.stringify(this.commandHandlers)}`, "debug");
		this.logger.log('Commands initialized', "info");
		
		// start BOT	
		if (!this.bot) this.bot = new TelegramBot(this.settings.token);		

		this.bot.on('text', (msg) => { this.handleMessage(msg);	});
		this.bot.startPolling();
	}

	async stop() {
		await this.bot?.stop();
		this.bot = null;
		return true;
	}

	async verifyToken(_token) {		
		// try to connect, if success disconnect and return true, else disconnect return false
		this.bot = new TelegramBot(_token);
		try {
			await this.bot.startPolling();
			await this.bot.stopPolling();
			this.logger.log(this.settings.locale.console.bot_token_verify_pass, "info");
			return true;
		} catch (error) {
			if (this.bot?.isPolling()) this.bot?.stopPolling();
			this.logger.log(this.settings.locale.console.bot_token_verify_fail + error, "error");
			return false;
		}
	}

	async sendMessage(chatID, message, replyID) {
		if (!message || !chatID) { 
			this.logger.log(this.settings.locale.console.bot_msg_verify_fail + message + chatID, "error");
			return; 
		}
	
		const options = replyID ? { reply_to_message_id: replyID, parse_mode: 'HTML' } : { parse_mode: 'HTML' };
	
		await this.bot.sendMessage(chatID, message, options)
			.then(() => { this.logger.log(this.settings.locale.console.bot_msg_send_pass + chatID + ": " + message, "info");})
			.catch((error) => { this.logger.log(this.settings.locale.console.bot_msg_send_fail + error, "error"); });
	}	

	async handleMessage(msg) {
		this.logger.log(`[${msg.from.id}][${msg.from.username}][${msg.from.first_name} ${msg.from.last_name}]: ${msg.text}`, "info");
		if (msg.text.startsWith('/')) { this.parseCmd(msg);	} 
		else { this.handleNormalMessage(msg); }
	}
	async parseCmd(msg) {
		let command = msg.text.split('@')[0];
		let _parsedCommand = command.includes(' ') ? await this.sliceBySpace(command) : [command];

		if (!_parsedCommand) { this.cmd_incorrect(msg); return;	}

		this.logger.log(this.settings.locale.console.bot_cmd_search + _parsedCommand[0], "info");

		const commandHandler = this.commandHandlers.find(({ command: cmd }) => _parsedCommand[0] === cmd);

		if (commandHandler) {
			this.logger.log(`Command ${_parsedCommand[0]} found, calling method`, "info");
			try { await commandHandler.handler(msg, _parsedCommand); }
			catch (err) { this.logger.log(err, "error"); }}
		else { this.logger.log(this.settings.locale.console.bot_cmd_search_fail + _parsedCommand[0], "info"); }
	}

	async sliceBySpace(_text){
		// command is divided by spacce, result is an array
		let command = _text.split(' ');
		for (var key in this.commands) {
			if (key == command[0]) {
				return command;
			}
		}
		return null;
	}

	async cmd_go(_msg) {
		if (!await this.db.db_user_isRegistered(_msg)) {
			await this.db.db_user_write(_msg);
			this.logger.log(this.settings.locale.console.bot_cmd_go_register_pass +  _msg.from.id, "info");
			this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_pass, _msg.message_id);
		}
		else {
			this.logger.log(this.settings.locale.console.bot_cmd_go_register_fail + _msg.from.id, "info");
			this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_go_fail, _msg.message_id);
		}		
	}

	async cmd_deleteme(_msg) {
		if (await this.db.db_user_isRegistered(_msg)) {
			await this.db.db_user_erase(_msg);
			this.logger.log(this.settings.locale.console.bot_cmd_deleteme_pass + _msg.from.id, "info");
			this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_deleteme_pass, _msg.message_id);
		} else {
			this.logger.log(this.settings.locale.console.bot_cmd_deleteme_fail + _msg.from.id, "info");
			this.sendMessage(_msg.chat.id, this.settings.locale.base.cmd_deleteme_fail, _msg.message_id);
		}
	}

	async cmd_incorrect(_msg) { await this.sendMessage(_msg.chat.id,  this.settings.locale.console.bot_cmd_read_fail, _msg.message_id); }
	async cmd_commands(_msg) {
		if (!await this.db.db_user_isRegistered(_msg)) { this.logger.log(this.settings.locale.console.bot_cmd_requirement_register);  return; }

		let message = this.settings.locale.base.bot_cmd_commands + "\n";
		for (const { command } of this.commandHandlers) {
			message += command + "\n";
		}
		await this.sendMessage(_msg.chat.id, message, _msg.message_id);
		this.logger.log(this.settings.locale.console.bot_cmd_commands, "info");
	}
	async handleNormalMessage(_msg){ if(!_msg) return; }
}

module.exports = TGBot;