import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'node:util'
import { ReadableStream, WritableStream, TransformStream } from 'node:stream/web'
import { MessageChannel, MessagePort } from 'node:worker_threads'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.TransformStream = TransformStream
global.MessageChannel = MessageChannel
global.MessagePort = MessagePort

if (typeof Request === 'undefined') {
  const { Request, Response, Headers, fetch, Blob } = require('undici')
  Object.assign(global, { Request, Response, Headers, fetch, Blob })
}

