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
    switch (command) {
      case Commands.GET:
        const { key } = commandArguments;
        return Cookies.get(key);
      case Commands.SET:
        const { key, value, options } = commandArguments;
        return Cookies.set(key, value, options);
      case Commands.REMOVE:
        const { key, options } = commandArguments;
        return Cookies.remove(key, options);
      case Commands.GET_JSON:
        const { key } = commandArguments;
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
