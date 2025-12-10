let wss = null;

export function setWebSocketServer(server) {
	wss = server;
}

export function broadcastNotification(message) {
	if (!wss) return;
	const data = JSON.stringify(message);
	wss.clients.forEach((client) => {
		if (client.readyState === 1) {
			client.send(data);
		}
	});
}

