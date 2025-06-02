import pino from 'pino';

const levelMap: Record<number, string> = {
	10: 'trace',
	20: 'debug',
	30: 'info',
	40: 'warn',
	50: 'error',
	60: 'fatal'
};

const transport = {
	write(chunk: string) {
		const pinoLogMessage = JSON.parse(chunk);

		const level = pinoLogMessage.any as number;

		const is404 = pinoLogMessage?.err?.status === 404;
		const severity = is404 ? 'debug' : levelMap[level] || level;

		const log = {
			severity,
			timestamp: new Date(pinoLogMessage.time).toISOString(),
			message: pinoLogMessage.msg,
			err: pinoLogMessage.err
			// ...pinoLogMessage
		};

		// delete log.msg;
		// delete log.level;
		// delete log.time;

		const newlineDelimitedJson = JSON.stringify(log) + '\n';
		process.stdout.write(newlineDelimitedJson);
	}
};

const logger = pino(
	{
		level: process.env.LOG_LEVEL || 'info'
	},
	transport
);

export default logger;
