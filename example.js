const { initializeServer } = require('cross-storage-plus');
initializeServer(window);

const CrossStorage = require('cross-storage-plus');
const storage = await CrossStorage.initializeClient('https://cross-storage-server.com');

await storage.setItem('key', { complex: 'value' });

const cookieStorage = storage.getProvider('cookieStorage');
const value = cookieStorage.get('key');