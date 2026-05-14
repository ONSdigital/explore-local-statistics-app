import pino from 'pino';

function stripAnsi(input: string): string {
	// eslint-disable-next-line no-control-regex
	return input.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
}

function stripAnsiDeep(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
	if (typeof value === 'string') return stripAnsi(value);
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map((v) => stripAnsiDeep(v, seen));
	if (typeof value !== 'object') return value;

	const obj = value as Record<string, unknown>;
	if (seen.has(obj)) return value;
	seen.add(obj);

	const out: Record<string, unknown> = {};
	for (const [key, v] of Object.entries(obj)) {
		out[key] = stripAnsiDeep(v, seen);
	}
	return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function is404Log(pinoLogMessage: any) {
	const errStatus = pinoLogMessage.err?.status;
	if (typeof errStatus === 'number' && errStatus === 404) return true;
	if (typeof errStatus === 'string' && errStatus === '404') return true;

	const msg = typeof pinoLogMessage?.msg === 'string' ? pinoLogMessage.msg : '';
	const cleaned = stripAnsi(msg).trim();
	// e.g. "[404] GET /foo" (some loggers prefix with a newline).
	return /^\[404\]\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//.test(cleaned);
}

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
		// reduce severity of 404s to avoid overwhelming the logs
		const is404 = is404Log(pinoLogMessage);
		const severity = is404 ? 20 : level;
		const severityName = levelMap[severity] || severity;

		const log = {
			created_at: new Date(pinoLogMessage.time).toISOString(),
			namespace: 'explore-local-statistics',
			event: `${severityName} event`,
			severity: severity,
			message: stripAnsiDeep(pinoLogMessage.msg),
			error: stripAnsiDeep(pinoLogMessage.err) // pinoLogMessage.err doesn't seem to exist any more
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
