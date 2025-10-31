import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create({
  binary: {
    downloadDir: "./mongodb-binaries",
  },
});

export default mongod;
