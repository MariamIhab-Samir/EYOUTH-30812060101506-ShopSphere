const {TextEncoder, TextDecoder}=require('node:util');
const {ReadableStream, WritableStream,TransformStream}=require('node:stream/web');
const {performance}=require('node:perf_hooks');
const{Blob, File}=require('node:buffer');
const{MessagePort, BroadcastChannel}=require('node:worker_threads');

Object.defineProperties(globalThis, {
    TextDecoder:{value:TextDecoder, writable: true, configurable:true},
    TextEncoder:{value:TextEncoder, writable: true, configurable:true},
    ReadableStream:{value:ReadableStream, writable: true, configurable:true},
    TransformStream:{value:TransformStream, writable: true, configurable:true},
    performance:{value:performance, writable: true, configurable:true},
    MessagePort:{value:MessagePort, writable: true, configurable:true},
    BroadcastChannel:{value: BroadcastChannel, writable: true, configurable:true}
});

const{fetch, Headers, FormData, Request, Response, Agent, getGlobalDispatcher}=require('undici');
Object.defineProperties(globalThis, {
    Blob: {value:Blob, writable: true, configurable:true},
    File:{value:File, writable: true, configurable:true},
    fetch:{value:fetch, writable: true, configurable:true},
    Headers:{value:Headers, writable: true, configurable:true},
    FormData:{value:FormData, writable: true, configurable:true},
    Request:{value:Request, writable: true, configurable:true},
    Response:{value:Response, writable: true, configurable:true}
});

global.__getGlobalDispatcher = getGlobalDispatcher;