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

		const level = pinoLogMessage.level as number;

		const is404 = pinoLogMessage?.err?.status === 404;
		const severity = is404 ? 'debug' : levelMap[level] || level;

		const log = {
			created_at: new Date(pinoLogMessage.time).toISOString(),
			namespace: 'explore-local-statistics',
			event: `${severity} event`,
			severity: severity,
			message: pinoLogMessage.msg,
			error: pinoLogMessage.err
		};

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
