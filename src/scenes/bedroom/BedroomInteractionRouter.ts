export interface BedroomInteractionHandlers {
  onPc: () => void;
  onCollection: () => void;
  onDoor: () => void;
}

export function routeBedroomInteraction(
  type: string,
  handlers: BedroomInteractionHandlers,
) {
  switch (type) {
    case 'pc':
      handlers.onPc();
      return;
    case 'collection':
      handlers.onCollection();
      return;
    case 'door':
      handlers.onDoor();
      return;
    default:
      return;
  }
}
