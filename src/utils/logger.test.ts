import { Writable } from 'stream';
import winston from 'winston';
import { createLogger } from './logger';

const captureLogger = (overrides: Parameters<typeof createLogger>[0] = {}) => {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  const log = createLogger(overrides);
  log.clear();
  log.add(new winston.transports.Stream({ stream }));
  return { log, lines };
};

describe('createLogger', () => {
  it('respects the configured level', () => {
    const { log, lines } = captureLogger({ level: 'warn', silent: false, format: 'json' });
    log.info('should be filtered');
    log.warn('should appear');
    log.error('should appear');
    const messages = lines.map((l) => JSON.parse(l).message);
    expect(messages).not.toContain('should be filtered');
    expect(messages).toEqual(expect.arrayContaining(['should appear']));
    expect(messages.filter((m) => m === 'should appear')).toHaveLength(2);
  });

  it('produces line-delimited JSON when format is json', () => {
    const { log, lines } = captureLogger({ level: 'info', silent: false, format: 'json' });
    log.info('hello', { feature: 'logging' });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.feature).toBe('logging');
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('produces human-readable output when format is pretty', () => {
    const { log, lines } = captureLogger({ level: 'info', silent: false, format: 'pretty' });
    log.info('hello world');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('hello world');
    expect(lines[0]).toContain('info');
    expect(() => JSON.parse(lines[0])).toThrow();
  });

  it('includes the error stack when an Error is passed as meta', () => {
    const { log, lines } = captureLogger({ level: 'error', silent: false, format: 'json' });
    const err = new Error('boom');
    log.error('something failed', err);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.message).toContain('something failed');
    expect(parsed.stack).toContain('Error: boom');
  });

  it('emits nothing when silent is true', () => {
    const { log, lines } = captureLogger({ level: 'silly', silent: true, format: 'json' });
    log.error('still nothing');
    log.warn('still nothing');
    log.info('still nothing');
    log.debug('still nothing');
    expect(lines).toHaveLength(0);
  });

  it('exposes the standard npm levels', () => {
    const { log } = captureLogger({ level: 'silly', silent: true });
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.http).toBe('function');
    expect(typeof log.verbose).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.silly).toBe('function');
  });
});
