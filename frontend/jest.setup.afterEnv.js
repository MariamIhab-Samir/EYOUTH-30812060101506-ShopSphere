const {server}=require('./src/mocks/server');
beforeAll(()=> server.listen());
afterEach(()=> server.resetHandlers());
afterAll(()=> server.close());
afterAll(async()=> await global.__getGlobalDispatcher().close());