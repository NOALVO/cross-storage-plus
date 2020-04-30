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

function _bindCommandListener(callback, { $window = window} = {}) {
  $window.addEventListener('message', (event) => {
    if (event.data.event === Events.COMMAND) {
      callback(event);
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
    const $window = this.window;
    // TODO: origin validation (whitelist)

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

    const result = this.providers[provider](command, commandArguments);
    _replyCommand(result, { $window });
  }

  initialize() {
    _bindCommandListener(this.onCommand, { $window: this.window });
  }

  addProvider(name, ProviderClass) {
    this.providers[name] = new ProviderClass(this.window);
  }
}

function initializeServer({
  $window = window,
  providers = {}
} = {}) {
  const allProviders = { ..._getDefaultProviders($window), ...providers }
  return new CrossStorageServer($window, allProviders);
}

module.exports = { initializeServer };
