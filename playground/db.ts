import { defineCommand, runMain } from "../src/index.ts";

const main = defineCommand({
  meta: {
    name: "db",
    version: "1.0.0",
    description: "Database query tool",
  },
  args: {
    table: {
      type: "positional",
      description: "Table name to query",
      required: true,
    },
    limit: {
      type: "string",
      description: "Max rows to return",
      default: "10",
    },
  },
  async setup(_ctx) {
    const client = new DatabaseClient();
    await client.connect();
    return { client };
  },
  async run({ args }, { client }) {
    const rows = await client.query(`SELECT * FROM ${args.table} LIMIT ${args.limit}`);
    console.log(rows);
  },
  async cleanup(_context, { client }) {
    await client.disconnect();
  },
});

// Stub database client
class DatabaseClient {
  connected = false;

  async connect() {
    this.connected = true;
    console.log("[db] Connected");
  }

  async query(sql: string) {
    if (!this.connected) throw new Error("Not connected");
    console.log(`[db] Query: ${sql}`);
    return [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
  }

  async disconnect() {
    this.connected = false;
    console.log("[db] Disconnected");
  }
}

runMain(main);
