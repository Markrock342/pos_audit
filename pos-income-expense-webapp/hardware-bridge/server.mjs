#!/usr/bin/env node
/**
 * Local Bridge — รับคำสั่งพิมพ์จาก Web App แล้วส่ง raw ESC/POS ไปเครื่องพิมพ์ LAN
 *
 * ใช้เมื่อ deploy บน Vercel (server บนคลาวด์เข้า IP ในร้านไม่ได้)
 *
 * รัน: npm run bridge
 * ตั้งค่าในแอป: URL Local Bridge = http://IP-เครื่องนี้:9101
 */
import http from "node:http";
import net from "node:net";

const PORT = Number(process.env.BRIDGE_PORT ?? 9101);
const HOST = process.env.BRIDGE_HOST ?? "0.0.0.0";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendToPrinter(host, port, buffer, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish(new Error("printer timeout")));
    socket.on("error", finish);
    socket.connect(port, host, () => {
      socket.write(buffer, (err) => {
        if (err) finish(err);
        else {
          socket.end();
          finish();
        }
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, port: PORT }));
    return;
  }

  if (req.method === "POST" && req.url === "/print") {
    try {
      const body = await readBody(req);
      const host = body.host;
      const port = Number(body.port ?? 9100);
      const data = Buffer.from(body.data ?? "", "base64");

      if (!host || !data.length) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "host and data required" }));
        return;
      }

      await sendToPrinter(host, port, data);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : "print failed" }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`[hardware-bridge] listening on http://${HOST}:${PORT}`);
  console.log("[hardware-bridge] health: GET /health");
  console.log("[hardware-bridge] print:  POST /print { host, port, data: base64 }");
});
