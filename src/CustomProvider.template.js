const Commands = {
  EXAMPLE_COMMAND: 'command',
};

class CustomServer {
  constructor($window) {
    this.window = $window;
  }

  get avaiableCommands() {
    return Object.keys(Commands).map(key => Commands[key]);
  }

  processCommand(command, commandArguments = {}) {
    switch (command) {

      case Commands.EXAMPLE_COMMAND:
        const { arg } = commandArguments;
        return EXAMPLESERVICE.EXAMPLEMETHOD(arg);

    }
  }
}

class CustomClient {
  constructor(sendCommandFunction) {
    this.sendCommand = sendCommandFunction;
  }

  async exampleMethod(arg) {
    const commandArguments = { arg };
    return this.sendCommand(Commands.EXAMPLE_COMMAND, commandArguments);
  }

}

module.exports = { server: CustomServer, client: CustomClient };
