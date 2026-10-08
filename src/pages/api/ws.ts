import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fetchMarketStocks } from '../../lib/marketData';

type ClientSocket = WebSocket & { stockIds?: string[] };

declare global {
  // Keep one WebSocket server while Next hot-reloads API modules in development.
  // eslint-disable-next-line no-var
  var marketWebSocketServer: WebSocketServer | undefined;
}

function createServer(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });
  let refreshing = false;

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    if (url.pathname !== '/api/ws') return;
    wss.handleUpgrade(request, socket, head, (client) =>
      wss.emit('connection', client, request)
    );
  });

  const publishPrices = async () => {
    if (refreshing) return;
    const clients = Array.from(wss.clients)
      .map((client) => client as ClientSocket)
      .filter(
        (client) =>
          client.readyState === WebSocket.OPEN && client.stockIds?.length
      );
    const symbols = Array.from(
      new Set(
        clients.flatMap((client) =>
          (client.stockIds ?? []).map((id) => id.replace(/^market_/, ''))
        )
      )
    );
    if (!symbols.length) return;
    refreshing = true;
    try {
      const stocks = await fetchMarketStocks(symbols);
      const updates = Object.fromEntries(
        stocks.map((stock) => [stock.id, stock.price])
      );
      const message = JSON.stringify({ type: 'prices', updates });
      clients.forEach((client) => client.send(message));
    } finally {
      refreshing = false;
    }
  };

  wss.on('connection', (client) => {
    const socket = client as ClientSocket;
    socket.stockIds = [];
    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as {
          type?: string;
          stockIds?: unknown;
        };
        if (message.type === 'subscribe' && Array.isArray(message.stockIds)) {
          socket.stockIds = message.stockIds
            .filter((id): id is string => typeof id === 'string')
            .slice(0, 100);
          void publishPrices();
        }
      } catch {
        // Ignore malformed client messages.
      }
    });
  });

  const interval = setInterval(() => void publishPrices(), 60_000);
  wss.on('close', () => clearInterval(interval));
  return wss;
}

export default function handler(
  _request: NextApiRequest,
  response: NextApiResponse
) {
  const server = (
    response.socket as
      (typeof response.socket & { server?: HttpServer }) | undefined
  )?.server;
  if (!server)
    return response.status(500).json({ error: 'WebSocket server unavailable' });
  if (!global.marketWebSocketServer)
    global.marketWebSocketServer = createServer(server);
  return response
    .status(426)
    .json({ error: 'Connect with WebSocket to receive live prices' });
}
