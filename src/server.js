const localStorageProvider = require('./LocalSessionStorageProvider');
const cookieProvider = require('./CookieProvider');
const { Events, InternalCommands } = require('./constants');

function _getDefaultProviders($window) {
  const localStorage = new localStorageProvider.server($window.localStorage);
  const sessionStorage = new localStorageProvider.server($window.sessionStorage);
  const cookie = new cookieProvider.server();
  return { localStorage, sessionStorage, cookie };
}

function _replyCommand(result, { $window = window} = {}) {
  $window.parent.postMessage({
    event: Events.REPLY,
    result,
  }, '*');
}

function _bindCommandListener(callback, { $window = window, bind } = {}) {
  $window.addEventListener('message', (event) => {
    if (event.data.event === Events.COMMAND) {
      if (bind) {
        return callback.bind(bind)(event.data, $window);
      }
      callback(event.data, $window);
    }
  });
}

class CrossStorageServer {
  constructor($window, providers) {
    this.window = $window;
    this.providers = providers
  }

  get providersNames() {
    return Object.keys(this.providers);
  }

  onCommand(event) {
    // TODO: origin validation (whitelist)
    const $window = this.window;

    const { provider, command, commandArguments } = event.data;

    if(command === InternalCommands.PING) {
      return _replyCommand(InternalCommands.PING, { $window });
    }

    if (command === InternalCommands.LIST_PROVIDERS) {
      return _replyCommand(this.providersNames, { $window });
    }

    if (!this.providersNames.includes(provider)) {
      return _replyCommand(new Error('PROVIDER NOT REGISTERED'), { $window });
    }

    const result = this.providers[provider].processCommand(command, commandArguments);
    _replyCommand(result, { $window });
  }

  initialize() {
    _bindCommandListener(this.onCommand, { bind: this });
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

    this.providers[_name] = new _provider(this.window, _options);
  }
}

function initializeServer({
  $window = window,
  providers = {}
} = {}) {
  const allProviders = { ..._getDefaultProviders($window), ...providers }
  const server = new CrossStorageServer($window, allProviders);
  server.initialize();
  return server;
}

module.exports = { initializeServer };
