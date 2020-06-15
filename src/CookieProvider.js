// TODO: externalize CookieProvider to remove this package dependency from js-cookie

const Cookies = require('js-cookie');

const Commands = {
  GET: 'set',
  SET: 'get',
  REMOVE: 'remove',
  GET_JSON: 'getJSON',
};

class CookieServerProvider {
  constructor() {
  }

  get avaiableCommands() {
    return Object.keys(Commands).map(key => Commands[key]);
  }

  processCommand(command, commandArguments = {}) {
    const { key, value, options } = commandArguments;
    switch (command) {
      case Commands.GET:
        return Cookies.get(key);
      case Commands.SET:
        return Cookies.set(key, value, options);
      case Commands.REMOVE:
        return Cookies.remove(key, options);
      case Commands.GET_JSON:
        return Cookies.getJSON(key);
    }
  }
}

class CookieClient {
  constructor(sendCommandFunction) {
    this.sendCommand = sendCommandFunction;
  }

  async get(key) {
    const commandArguments = { key };
    return this.sendCommand(Commands.GET, commandArguments);
  }

  async set(key, value, options) {
    const commandArguments = { key, value, options };
    return this.sendCommand(Commands.SET, commandArguments);
  }

  async remove(key, options) {
    const commandArguments = { key, options };
    return this.sendCommand(Commands.REMOVE, commandArguments);
  }

  async getJSON() {
    const commandArguments = { key };
    return this.sendCommand(Commands.GET_JSON, commandArguments);
  }
}

module.exports = { server: CookieServerProvider, client: CookieClient };
