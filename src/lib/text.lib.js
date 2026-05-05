export function chunkText(text, maxChunkLength = 1800) {
  const chunks = [];
  let currentChunk = "";
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];

  for (const sentence of sentences) {
    if (sentence.length > maxChunkLength) {
      let sentencePart = "";
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if ((sentencePart + " " + word).length > maxChunkLength) {
          chunks.push(sentencePart.trim());
          sentencePart = word;
        } else {
          sentencePart += (sentencePart ? " " : "") + word;
        }
      }
      if (sentencePart.trim()) {
        if ((currentChunk + " " + sentencePart).length > maxChunkLength) {
          chunks.push(currentChunk.trim());
          currentChunk = sentencePart;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentencePart;
        }
      }
    } else {
      if ((currentChunk + sentence).length > maxChunkLength) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}
