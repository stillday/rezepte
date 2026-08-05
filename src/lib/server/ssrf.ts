import net from 'node:net';

// Erkennt private/interne IPs (RFC1918, Loopback, Link-Local, ULA) — Schutz vor SSRF
// beim Link-Import (verhindert Zugriff auf z.B. 169.254.169.254 Cloud-Metadata oder localhost).
export function isPrivateIp(ip: string): boolean {
	// IPv4-mapped IPv6 (::ffff:127.0.0.1) auf die v4-Adresse reduzieren
	const v4 = ip.replace(/^::ffff:/i, '');
	if (!net.isIP(v4)) return true;
	return (
		/^(127\.|10\.|169\.254\.|0\.)/.test(v4) ||
		/^172\.(1[6-9]|2\d|3[0-1])\./.test(v4) ||
		/^192\.168\./.test(v4) ||
		/^(::1$|fc|fd|fe80|::$)/i.test(v4)
	);
}
