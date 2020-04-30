const localStorageProvider = require('./LocalSessionStorageProvider');
const cookieProvider = require('./CookieProvider');
const { IFRAME_ID, Events, InternalCommands } = require('./constants');

async function sleep(timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, timeout);
  });
}

function _setDefaultProviders(client) {
  client.addProvider('localStorage', localStorageProvider.client);
  client.addProvider('sessionStorage', localStorageProvider.client);
  client.addProvider('cookie', cookieProvider.client);
}

function _isAllowedOrigin(allowedDomains, origin) {
  if (allowedDomains && allowedDomains.length) {
    return !!allowedDomains.find(x => x === origin);
  }
  return true;
}

async function _sendCommand(provider, command, {
  commandArguments,
  iframeId = IFRAME_ID,
  $window = window,
  allowedDomains = []
} = {}) {
  const iframe = $window.document.getElementById(iframeId).contentWindow;
  return new Promise((resolve) => {

    $window.addEventListener('message', (event) => {
      if (event.data.event === Events.REPLY) {

        if (!_isAllowedOrigin(allowedDomains, event.origin)) {
          // TODO: logging
          throw `NOT ALLOWED ORIGIN ${event.origin}`;
        }

        resolve(event.data.result);
      }
    });

    iframe.postMessage({
      event: Events.COMMAND,
      data: { provider, command, commandArguments },
    });
  });
}

function _createIframeIfNotExists(iframeId, $window, serverUrl) {
  const iframe = $window.document.getElementById(iframeId);
  if (!iframe) {
    const elem = $window.document.createElement('iframe');
    elem.id = iframeId;
    elem.src = serverUrl;
    elem.style.cssText = 'width: 1px; height: 1px; border:0 solid transparent; position: absolute; top: 0; left: 0';
    $window.document.body.appendChild(elem);
  }
}

async function _sendPingAndWaitReply($window, iframeId, { allowedDomains }) {
  let count = 0;
  while(count < 10) {
    const pingPromise = _sendCommand(InternalCommands.PING, { iframeId, $window, allowedDomains });
    const reply = await Promise.race([ sleep(1000), pingPromise ]);
    if (reply === InternalCommands.PING) {
      return true;
    }
    count++;
  }
}

class CrossStorageClient {
  constructor({
    iframeId,
    $window,
    allowedDomains,
  } = {}) {
    this.iframeId = iframeId;
    this.$window = $window;
    this.allowedDomains = allowedDomains;
    this.providers = {};
  }

  get providersNames() {
    return Object.keys(this.providers);
  }

  getProvider(name) {
    return this.providers[name];
  }

  addProvider(name, Provider) {
    const sendCommandFn = async (command, commandArguments) => {
      return _sendCommand(name, command, {
        commandArguments,
        iframeId: this.iframeId,
        $window: this.$window,
        allowedDomains: this.allowedDomains,
      });
    };
    const provider = new Provider(sendCommandFn);

    //#region ADDED TO PROVIDER BECAUSE initializeServer RETURN localStorage PROVIDER
    provider.getProvider = this.getProvider;
    provider.addProvider = this.addProvider;
    provider.listProviders = this.listProviders;
    //#endregion

    this.providers[name] = provider;
  }

  async listProviders() {
    return _sendCommand('CROSS-STORAGE', InternalCommands.LIST_PROVIDERS, {
      iframeId: this.iframeId,
      $window: this.$window,
      allowedDomains: this.allowedDomains,
    });
  }
}

async function initializeClient(serverUrl, {
  iframeId = IFRAME_ID,
  $window = window,
  allowedDomains = [],
} = {}) {
  _createIframeIfNotExists(iframeId, $window, serverUrl);
  const connected = await _sendPingAndWaitReply($window, iframeId, { allowedDomains });
  if (!connected) throw new Error('CROSS STORAGE SERVER DID NOT REPLY');

  const client = new CrossStorageClient({ iframeId, $window, allowedDomains });
  _setDefaultProviders(client);

  return client.getProvider('localStorage'); // default provider
}

module.exports = { initializeClient };
