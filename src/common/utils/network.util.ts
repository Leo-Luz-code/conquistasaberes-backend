import * as os from 'os';

/**
 * Detecta dinamicamente o endereço IPv4 local da máquina onde o servidor está rodando.
 * Funciona em qualquer rede (Wi-Fi, Ethernet, Hotspot), sem necessidade de IP fixo.
 */
export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
