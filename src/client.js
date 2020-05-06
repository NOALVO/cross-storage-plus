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
  const iframeElement = $window.document.getElementById(iframeId);
  const iframe = iframeElement.contentWindow;

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
    }, '*');
  });
}

async function _createIframeIfNotExists(iframeId, $window, serverUrl, { timeout }) {
  let iframe = $window.document.getElementById(iframeId);
  if (!iframe) {
    const elem = $window.document.createElement('iframe');
    elem.id = iframeId;
    elem.src = serverUrl;
    elem.style.cssText = 'width: 1px; height: 1px; border:0 solid transparent; position: absolute; top: 0; left: 0';
    $window.document.body.appendChild(elem);
  }

  iframe = $window.document.getElementById(iframeId);
  if (!iframe.contentWindow) {
    await sleep(timeout);
    iframe = $window.document.getElementById(iframeId);
    if (!iframe.contentWindow) {
      throw new Error(`O IFRAME NÃO FOI CARREGADO NO TIMEOUT ${timeout}`)
    }
  }
}

async function _sendPingAndWaitReply(provider, $window, iframeId, { allowedDomains }) {
  let count = 0;
  while(count < 10) {
    const pingPromise = _sendCommand(provider, InternalCommands.PING, { iframeId, $window, allowedDomains });
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

  addProvider(name, provider, options) {
    let _name, _provider, _options;
    if (typeof name === 'string') {
      _name = name;
      _provider = provider;
      _options = options;
    } else {
      _provider = name;
      _name = _provider.PROVIDER;
      _options = provider;
    }

    const sendCommandFn = async (command, commandArguments) => {
      return _sendCommand(_name, command, {
        commandArguments,
        iframeId: this.iframeId,
        $window: this.$window,
        allowedDomains: this.allowedDomains,
      });
    };
    const newProvider = new _provider(sendCommandFn, _options);

    //#region ADDED TO PROVIDER BECAUSE initializeServer RETURN localStorage PROVIDER
    newProvider.getProvider = this.getProvider;
    newProvider.addProvider = this.addProvider;
    newProvider.listProviders = this.listProviders;
    //#endregion

    this.providers[_name] = newProvider;
  }

  async listProviders() {
    return _sendCommand('CROSS-STORAGE', InternalCommands.LIST_PROVIDERS, {
      iframeId: this.iframeId,
      $window: this.$window,
      allowedDomains: this.allowedDomains,
    });
  }
}

const INITIAL_PROVIDER = 'localStorage';

async function initializeClient(serverUrl, {
  iframeId = IFRAME_ID,
  $window = window,
  allowedDomains = [],
  iframeTimeout = 3000,
  initialProvider = INITIAL_PROVIDER,
} = {}) {
  const provider = initialProvider === INITIAL_PROVIDER ? INITIAL_PROVIDER : initialProvider.PROVIDER;

  await _createIframeIfNotExists(iframeId, $window, serverUrl, { timeout: iframeTimeout });

  const connected = await _sendPingAndWaitReply(provider, $window, iframeId, { allowedDomains });
  if (!connected) throw new Error('CROSS STORAGE SERVER DID NOT REPLY');

  const client = new CrossStorageClient({ iframeId, $window, allowedDomains });
  _setDefaultProviders(client);

  if (provider !== INITIAL_PROVIDER) client.addProvider(initialProvider);

  return client.getProvider(provider);
}

module.exports = { initializeClient };
