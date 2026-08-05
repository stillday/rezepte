import { describe, it, expect } from 'vitest';
import { isPrivateIp } from './ssrf';

describe('isPrivateIp', () => {
	it('erkennt Loopback', () => {
		expect(isPrivateIp('127.0.0.1')).toBe(true);
		expect(isPrivateIp('127.255.255.255')).toBe(true);
	});

	it('erkennt RFC1918 private Ranges', () => {
		expect(isPrivateIp('10.0.0.1')).toBe(true);
		expect(isPrivateIp('192.168.1.1')).toBe(true);
		expect(isPrivateIp('172.16.0.1')).toBe(true);
		expect(isPrivateIp('172.31.255.255')).toBe(true);
	});

	it('erkennt Link-Local (Cloud-Metadata-Range)', () => {
		expect(isPrivateIp('169.254.169.254')).toBe(true);
	});

	it('erkennt 0.0.0.0', () => {
		expect(isPrivateIp('0.0.0.0')).toBe(true);
	});

	it('erkennt IPv4-mapped IPv6 Loopback', () => {
		expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
	});

	it('erkennt IPv6 Loopback und ULA', () => {
		expect(isPrivateIp('::1')).toBe(true);
		expect(isPrivateIp('fc00::1')).toBe(true);
		expect(isPrivateIp('fd12:3456::1')).toBe(true);
		expect(isPrivateIp('fe80::1')).toBe(true);
	});

	it('lehnt ungültige Eingaben als "nicht öffentlich" ab (fail closed)', () => {
		expect(isPrivateIp('not-an-ip')).toBe(true);
		expect(isPrivateIp('')).toBe(true);
	});

	it('lässt echte öffentliche IPv4-Adressen durch', () => {
		expect(isPrivateIp('8.8.8.8')).toBe(false);
		expect(isPrivateIp('1.1.1.1')).toBe(false);
		expect(isPrivateIp('93.184.216.34')).toBe(false);
	});

	it('grenzt 172.x korrekt ab (15 und 32 sind NICHT privat)', () => {
		expect(isPrivateIp('172.15.255.255')).toBe(false);
		expect(isPrivateIp('172.32.0.0')).toBe(false);
	});

	it('lässt öffentliche IPv6-Adressen durch', () => {
		expect(isPrivateIp('2606:4700:4700::1111')).toBe(false);
	});
});
