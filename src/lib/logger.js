import pino from 'pino'

const transport = {
  write(chunk) {
    const log = JSON.parse(chunk)

    const levelMap = {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal'
    }

    const formatted = {
      timestamp: new Date(log.time).toISOString(),
      severity: levelMap[log.level] || log.level,
      message: log.msg,
      ...log
    }

    delete formatted.msg
    delete formatted.level
    delete formatted.time

    process.stdout.write(JSON.stringify(formatted) + '\n')
  }
}

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info'
  },
  transport
)

export default logger
