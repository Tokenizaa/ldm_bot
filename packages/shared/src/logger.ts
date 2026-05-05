export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  service: string;
  env?: string;
  executionId?: string;
  jobId?: string;
  workerId?: string;
}

export function log(level: LogLevel, ctx: LogContext, message: string, extra?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    service: ctx.service,
    env: ctx.env,
    executionId: ctx.executionId,
    jobId: ctx.jobId,
    workerId: ctx.workerId,
    msg: message,
    ...extra
  };

  const line = JSON.stringify(payload);

  // Keep dependency-free for now; in the next step, swap for pino.
  // eslint-disable-next-line no-console
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

