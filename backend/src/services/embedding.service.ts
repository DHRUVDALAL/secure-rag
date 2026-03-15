import { getEmbedding } from "./localEmbedding.service";

export async function generateEmbedding(text: string) {
  return await getEmbedding(text);
}