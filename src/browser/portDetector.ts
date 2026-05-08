// Porta fixa para simplificar - sempre 9222
export const CDP_PORT = 9222;
export const CDP_HOST = 'localhost';

export function getCDPUrl(): string {
  return `http://${CDP_HOST}:${CDP_PORT}`;
}
