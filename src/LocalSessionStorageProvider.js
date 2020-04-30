const Commands = {
  GET_ITEM: 'getItem',
  SET_ITEM: 'setItem',
  REMOVE_ITEM: 'removeItem',
  CLEAR: 'clear',
};

class LocalSessionStorageServer {
  constructor($localStorage) {
    this.storage = $localStorage;
  }

  get avaiableCommands() {
    return Object.keys(Commands).map(key => Commands[key]);
  }

  processCommand(command, commandArguments) {
    switch (command) {
      case Commands.GET_ITEM:
        const { key } = commandArguments;
        return this.storage.getItem(key);
      case Commands.SET_ITEM:
        const { key, value } = commandArguments;
        return this.storage.setItem(key, value);
      case Commands.REMOVE_ITEM:
        const { key } = commandArguments;
        return this.storage.removeItem(key);
      case Commands.CLEAR:
        return this.storage.clear();
    }
  }
}

class LocalSessionStorageClient {
  constructor(sendCommandFunction) {
    this.sendCommand = sendCommandFunction;
  }

  async getItem(key) {
    const commandArguments = { key };
    return this.sendCommand(Commands.GET_ITEM, commandArguments);
  }

  async setItem(key, value) {
    const commandArguments = { key, value };
    return this.sendCommand(Commands.SET_ITEM, commandArguments);
  }

  async removeItem(key) {
    const commandArguments = { key };
    return this.sendCommand(Commands.REMOVE_ITEM, commandArguments);
  }

  async clear() {
    return this.sendCommand(Commands.CLEAR);
  }
}

module.exports = { server: LocalSessionStorageServer, client: LocalSessionStorageClient };
