/* global require */
require("@testing-library/jest-dom")
const { TextEncoder, TextDecoder } = require("node:util")
const { ReadableStream, WritableStream, TransformStream } = require("node:stream/web")
const { MessageChannel, MessagePort } = require("node:worker_threads")

globalThis.TextEncoder = TextEncoder
globalThis.TextDecoder = TextDecoder
globalThis.ReadableStream = ReadableStream
globalThis.WritableStream = WritableStream
globalThis.TransformStream = TransformStream
globalThis.MessageChannel = MessageChannel
globalThis.MessagePort = MessagePort

if (typeof globalThis.fetch === "undefined") {
  const { Request, Response, Headers, fetch, Blob } = require("undici")
  Object.assign(globalThis, { Request, Response, Headers, fetch, Blob })
}
