import { embeddingsQueue } from "../embeddings.queue";

export const embeddingsWorker = {
  async close() {
    await embeddingsQueue.obliterate({ force: true });
  },
};
