# cross-storage-plus

Cross-domain browser storage API that supports any kind of storage. More extensible and featured than [cross-storage](https://github.com/zendesk/cross-storage) and [cross-domain-storage](https://github.com/MatthewLarner/cross-domain-storage).

> 🆘 **Help** this project by conttributing to its documentation or developing its [roadmap](#Features).

## Features

- [x] Remote cross-domain storage initialization
- [x] LocalStorage, SessionStorage and cookies support
- [x] Custom storage provider
- [ ] Origin validation in client and server
- [ ] Method authorization per client domain
- [ ] IndexedDB support

*Not checked features are in roadmap.

## Basic Usage

### What you will need first

Cross domain storage is designed to initialize a storage server inside a web application, that listens to commands sent to it.

In its way, the client inside another web application send commands to the server intialized in the first web application.

Then, **you will need at least two web applications in different domains** (one as the server).

### 1. Install it via package manager in both server and client apps

```
$ npm i --S cross-storage-plus
```

### 2. Initialize the server on server app

`https://your-example-domain-server.com/cross-storage`
```javascript
require('cross-storage-plus').initializeServer();
```

### 3. Initialize the client on client apps

```javascript
const CrossStorage = require('cross-storage-plus');

const storage = await CrossStorage.initializeClient('https://your-example-domain-server.com/cross-storage');
```

## Default storage methods

By default, the `initializeClient()` method will always return the `localStorage` provider, so you can use the LocalStorage main methods (getItem, setItem, removeItem and clear), i.e.:

```javascript
await storage.setItem('key', { complex: 'value' });
```

## SessionStorage and cookie storage

You can change the storage provider to `sessionStorage` or `cookie` using the `getProvider()` method.

```javascript
const cookieStorage = storage.getProvider('cookieStorage');
const value = cookieStorage.get('key');
```

> ℹ When using `cookie` provider, you must use the storage methods as implemented in [js-cookie](https://github.com/js-cookie/js-cookie) (get, set, remove, getJSON).

## Advanced Usage

### ⭐ Adding your own custom provider

> **Halt!** See the [template file](./CustomProvider.template.js) for an entire example to make your client and server provider classes.

Basically, the client and server classes must implement:

**Server**
- A `constructor($window)`, where `$window` is the DOM Window object in the server.
- A `processCommand(command, commandArguments)` method.

**Client**
- A `constructor(sendCommandFunction)`, where `sendCommandFunction` is the function to call by you class methods.
- Your own class async methods

Then, you must add the provider to server and clients:

In the server:

```javascript
const server = require('cross-storage-plus').initializeServer();

server.addProvider('custom', ProviderServer);
```

In the client:

```javascript
storage.addProvider('custom', ProviderClient);
```
