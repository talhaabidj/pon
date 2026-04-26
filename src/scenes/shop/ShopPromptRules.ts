import type { ActiveTask, Item, MachineState } from '../../data/types.js';
import type { ShopPromptAction } from '../../ui/shopHUD.js';
import { getMachineIssuePrompt, getMachineOutOfOrderPrompt } from './MachineIssuePrompts.js';
import { canUseTokenStation } from './TokenStationFlow.js';
import { ARCADE_STATUS_TEXT } from './ArcadeStatusText.js';
import { getWondertradeStatus } from './WondertradeResolver.js';

export interface ShopPromptContextInput {
  type: string;
  defaultPrompt: string;
  machineId?: string;
  machineState?: MachineState;
  tasks: readonly ActiveTask[];
  hasCapsuleRefill: boolean;
  hasTokenRefill: boolean;
  canPullNow: boolean;
  tokenStationState: MachineState;
  hasAnyCapsuleRestockNeed: boolean;
  hasAnyTokenRestockNeed: boolean;
  wondertradeOwnedIds: string[];
  items: Item[];
}

export function hasMachineServiceNeed(state: MachineState | undefined): boolean {
  if (!state) return false;
  return (
    state.cleanliness === 'dirty' ||
    !state.isPowered ||
    state.isJammed ||
    state.stockLevel !== 'ok'
  );
}

export function getContextualPrompt(input: ShopPromptContextInput): string {
  if (input.type === 'machine') {
    if (input.machineId) {
      const outOfOrderPrompt = getMachineOutOfOrderPrompt(
        input.machineState,
        input.hasCapsuleRefill,
      );
      if (outOfOrderPrompt) return outOfOrderPrompt;

      const issuePrompt = getMachineIssuePrompt({
        machineId: input.machineId,
        machineState: input.machineState,
        hasCapsuleRefill: input.hasCapsuleRefill,
        tasks: input.tasks,
      });
      if (issuePrompt) {
        const isLowStock = input.machineState?.stockLevel === 'low';
        if (isLowStock) {
          if (!input.canPullNow) {
            return input.hasCapsuleRefill
              ? 'LOW STOCK - Need tokens to pull'
              : 'LOW STOCK - Need tokens or refill canister';
          }
          return input.hasCapsuleRefill
            ? 'LOW STOCK - Pull or restock'
            : 'LOW STOCK - Pull now or grab refill canister';
        }
        return issuePrompt;
      }
    }

    if (!input.canPullNow) return 'Need tokens to pull';
    return 'Ready to pull';
  }

  if (input.type === 'storage-crate') {
    if (input.hasCapsuleRefill) return 'Refill canister ready — service restock task';
    if (input.hasAnyCapsuleRestockNeed) return 'Take refill canister from crate';
    return 'Storage crate';
  }

  if (input.type === 'token-crate') {
    if (input.hasTokenRefill) return 'Token refill pack ready — service terminal';
    if (input.hasAnyTokenRestockNeed) return 'Take token refill pack';
    return 'Token refill crate';
  }

  if (input.type === 'token-station') {
    if (!input.tokenStationState.isPowered) return ARCADE_STATUS_TEXT.outOfOrderRequiresPower;
    if (input.tokenStationState.isJammed) return ARCADE_STATUS_TEXT.outOfOrderJammed;
    if (input.tokenStationState.stockLevel === 'empty') {
      if (input.hasTokenRefill) return 'OUT OF ORDER - Ready to restock';
      return ARCADE_STATUS_TEXT.outOfOrderRestockNeeded;
    }
    if (input.tokenStationState.stockLevel === 'low') {
      if (input.hasTokenRefill) return 'LOW STOCK - Buy now or restock';
      return 'LOW STOCK - Buy now or get token refill pack';
    }
    if (input.tokenStationState.cleanliness === 'dirty') return ARCADE_STATUS_TEXT.serviceCleanScreen;
    return ARCADE_STATUS_TEXT.buyTokens;
  }

  if (input.type === 'shop-exit') return 'End Shift';
  if (input.type === 'wondertrade') {
    const status = getWondertradeStatus(input.wondertradeOwnedIds, input.items);
    if (!status.canTrade && status.reason === 'need-owned-items') {
      return 'Wonder Exchange (need collected items)';
    }
    if (!status.canTrade && status.reason === 'collection-complete') {
      return 'Wonder Exchange (collection complete)';
    }
    return 'Wonder Exchange';
  }

  return input.defaultPrompt;
}

export function getContextualActions(input: ShopPromptContextInput): ShopPromptAction[] {
  if (input.type === 'machine') {
    const canPullNow = Boolean(input.machineId && input.machineState && input.canPullNow);
    const hasServiceNeed = hasMachineServiceNeed(input.machineState);

    if (canPullNow && hasServiceNeed) {
      return [{ key: 'E', label: 'Pull' }, { key: 'R', label: 'Service' }, { key: 'F', label: 'View Drops' }];
    }
    if (!canPullNow && hasServiceNeed) {
      return [{ key: 'R', label: 'Service' }, { key: 'F', label: 'View Drops' }];
    }
    return [{ key: 'E', label: 'Pull' }, { key: 'F', label: 'View Drops' }];
  }

  if (input.type === 'token-crate') {
    return [{ key: 'R', label: 'Take Pack' }];
  }

  if (input.type === 'storage-crate') {
    return [{ key: 'R', label: 'Take Refill' }];
  }

  if (input.type === 'token-station') {
    const canUseStation = canUseTokenStation(input.tokenStationState);
    const hasServiceNeed = hasMachineServiceNeed(input.tokenStationState);

    if (canUseStation && hasServiceNeed) {
      return [{ key: 'E', label: 'Buy Tokens' }, { key: 'R', label: 'Service' }];
    }
    if (!canUseStation && hasServiceNeed) {
      return [{ key: 'R', label: 'Service' }];
    }

    return [{ key: 'E', label: 'Buy Tokens' }];
  }

  if (input.type === 'floor-spot') return [{ key: 'R', label: 'Mop' }];
  if (input.type === 'wondertrade') return [{ key: 'E', label: 'Trade' }];
  if (input.type === 'shop-exit') return [{ key: 'E', label: 'End Shift' }];
  if (input.type === 'secret') return [{ key: 'E', label: 'Inspect' }];

  return [{ key: 'E', label: 'Interact' }];
}
