module.exports = class Logger {
	constructor(levels, _callback) {
		try {
			this.levels = levels || ["info", "error", "warning"];
			this.colors = {
				"normal": '\u001b[0m',
				"info": '\u001b[38;5;46m',
				"warning": '\u001b[38;5;226m', 
				"error": '\u001b[38;5;196m',
				"debug": '\u001b[38;5;21m'
			};
			this.log("Logger initialized.", "info");
			if (_callback && typeof _callback === 'function') _callback();
		} catch (error) {
			console.error("Error initializing logger: ", error.stack);
		}
	}

	log(message, color) {
		const callerName = new Error().stack.split('\n')[2].trim().split(' ')[1];
		const selectedColor = this.colors[color] || this.colors.normal;
		if (this.levels.includes(color)) {
			console.log(`> ${selectedColor}[${callerName}]: ${this.colors.normal + message}`);
		}
	}
}