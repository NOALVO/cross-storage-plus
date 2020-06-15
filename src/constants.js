const IFRAME_ID = 'cross-storage-iframe';

const Events = {
  COMMAND: 'CSI_COMMAND',
  REPLY: 'CSI_REPLY',
};

const InternalCommands = {
  PING: 'PING',
  LIST_PROVIDERS: 'LIST_PROVIDERS'
};

module.exports = { IFRAME_ID, Events, InternalCommands };
