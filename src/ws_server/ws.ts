import { WebSocketServer } from 'ws';

export const wss = new WebSocketServer(
  {
    port: 3000,
  },
  () => console.log('WSS started!'),
);

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    const c = JSON.parse(data.toString());
    if (c.type === 'reg') {
      ws.send(
        JSON.stringify({
          type: "reg",
          data:
              JSON.stringify({
                  name: 'test',
                  index: crypto.randomUUID(),
                  error: false,
                  errorText: '',
              }),
          id: 0,
      }))
      ;
      ws.send(
        JSON.stringify({
          type: "update_winners",
          data:
              [],
          id: 0,
      })
      );

      ws.send(
        JSON.stringify(
          {
            type: "update_room",
            data:
                [],
            id: 0,
        }
        )
      )
    }
  });
});
