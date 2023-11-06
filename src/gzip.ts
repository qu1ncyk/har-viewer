declare class CompressionStream extends TransformStream<
    BufferSource,
    ArrayBuffer
> {
    constructor(format: "gzip" | "deflate" | "deflate-raw");
}
declare class DecompressionStream extends TransformStream<
    BufferSource,
    ArrayBuffer
> {
    constructor(format: "gzip" | "deflate" | "deflate-raw");
}

/**
 * Decompress a `BufferSource` to a `ReadableStream`.
 */
export function decompressStreaming(gzipped: BufferSource) {
    const stream = new DecompressionStream("gzip");
    const writer = stream.writable.getWriter();
    writer.write(gzipped);
    writer.close();

    return stream.readable;
}

/**
 * Decompress a `BufferSource` to a decoded JSON object.
 */
export async function decompressToJson(gzipped: BufferSource) {
    const readable = decompressStreaming(gzipped);
    return await new Response(readable).json();
}

/**
 * Decompress a `BufferSource` to a decoded `ArrayBuffer`.
 */
export async function decompressToBytes(gzipped: BufferSource) {
    const readable = decompressStreaming(gzipped);
    return await new Response(readable).arrayBuffer();
}

/**
 * Compress a `BufferSource` to an `ArrayBuffer`.
 */
export async function compressToBytes(decompressed: BufferSource) {
    const stream = new CompressionStream("gzip");
    const writer = stream.writable.getWriter();
    writer.write(decompressed);
    writer.close();

    return await new Response(stream.readable).arrayBuffer();
}

/**
 * Compress an `ArrayBuffer` if the client supports `CompressionStream`s and if
 * the `ArrayBuffer` compresses well (size reduction of at least 10%).
 */
export async function tryCompress(decompressed: ArrayBuffer): Promise<{
    result: ArrayBuffer;
    compressed: boolean;
}> {
    if (!CompressionStream) {
        return { result: decompressed, compressed: false };
    }

    const compressed = await compressToBytes(decompressed);
    if (compressed.byteLength < decompressed.byteLength * 0.9) {
        return { result: compressed, compressed: true };
    } else {
        return { result: decompressed, compressed: false };
    }
}
