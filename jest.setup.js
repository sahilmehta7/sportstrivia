import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'
import { ReadableStream, WritableStream, TransformStream } from 'node:stream/web'
import { MessageChannel, MessagePort } from 'node:worker_threads'
import { Request, Response, Headers, fetch, Blob } from 'undici'

globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder
globalThis.ReadableStream = ReadableStream
globalThis.WritableStream = WritableStream
globalThis.TransformStream = TransformStream
globalThis.MessageChannel = MessageChannel
globalThis.MessagePort = MessagePort

if (typeof Request === 'undefined') {
  Object.assign(globalThis, { Request, Response, Headers, fetch, Blob })
}
