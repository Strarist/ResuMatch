export class RuntimeStateReconciler {
  /**
   * Safely merges a partial incoming delta into an existing state branch.
   * It prevents overwriting healthy data with undefined/null if the key
   * is omitted or empty in the delta payload.
   */
  static deepMerge<T>(existingState: T, incomingDelta: Partial<T> | undefined | null): T {
    if (!incomingDelta) return existingState;

    if (Array.isArray(existingState) && Array.isArray(incomingDelta)) {
      // For arrays, if the backend sends a new array in a delta,
      // we usually want to accept the new array entirely instead of index-by-index merge
      // but we filter out nulls/undefined from the incoming.
      return incomingDelta.filter(item => item !== undefined && item !== null) as unknown as T;
    }

    if (
      typeof existingState === 'object' && existingState !== null &&
      typeof incomingDelta === 'object' && incomingDelta !== null
    ) {
      const result = { ...existingState } as Record<string, unknown>;
      const deltaObj = incomingDelta as Record<string, unknown>;

      for (const key of Object.keys(deltaObj)) {
        const val = deltaObj[key];
        if (val !== undefined && val !== null) {
          const existingVal = result[key];
          if (
            typeof existingVal === 'object' && existingVal !== null &&
            typeof val === 'object' && !Array.isArray(val)
          ) {
            result[key] = RuntimeStateReconciler.deepMerge(existingVal, val);
          } else {
            result[key] = val;
          }
        }
      }
      return result as unknown as T;
    }

    return incomingDelta !== undefined && incomingDelta !== null ? (incomingDelta as unknown as T) : existingState;
  }

  /**
   * Hardened deep merge that guarantees structural continuity across delta streams.
   * - Filters out null and undefined values.
   * - Restores missing array/topology entities based on stable keys.
   * - Preserves existing healthy branches rather than overriding with partial updates.
   */
  static deepMergeStable<T>(existingState: T, incomingDelta: Partial<T> | undefined | null): T {
    if (incomingDelta === undefined || incomingDelta === null) {
      return existingState;
    }

    if (Array.isArray(existingState) && Array.isArray(incomingDelta)) {
      const getIdentifier = (item: unknown): string | null => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        if ('id' in obj && obj.id !== undefined && obj.id !== null) return String(obj.id);
        if ('agent_id' in obj && obj.agent_id !== undefined && obj.agent_id !== null) return String(obj.agent_id);
        if ('source' in obj && 'target' in obj && obj.source !== undefined && obj.target !== undefined) {
          return `${obj.source}-${obj.target}`;
        }
        if ('signal' in obj && obj.signal !== undefined && obj.signal !== null) return String(obj.signal);
        if ('title' in obj && obj.title !== undefined && obj.title !== null) return String(obj.title);
        return null;
      };

      const idMap = new Map<string, unknown>();
      existingState.forEach(item => {
        const id = getIdentifier(item);
        if (id) idMap.set(id, item);
      });

      const mergedArray: unknown[] = [];
      const handledIds = new Set<string>();

      incomingDelta.forEach(item => {
        if (item === null || item === undefined) return;
        const id = getIdentifier(item);
        if (id) {
          const existing = idMap.get(id);
          if (existing) {
            mergedArray.push(RuntimeStateReconciler.deepMergeStable(existing, item));
          } else {
            mergedArray.push(item);
          }
          handledIds.add(id);
        } else {
          mergedArray.push(item);
        }
      });

      // Maintain items that were not present in the delta (branch/topology preservation)
      existingState.forEach(item => {
        const id = getIdentifier(item);
        if (id && !handledIds.has(id)) {
          mergedArray.push(item);
        }
      });

      return mergedArray as unknown as T;
    }

    if (
      typeof existingState === 'object' && existingState !== null &&
      typeof incomingDelta === 'object' && incomingDelta !== null
    ) {
      const result = { ...existingState } as Record<string, unknown>;
      const deltaObj = incomingDelta as Record<string, unknown>;

      for (const key of Object.keys(deltaObj)) {
        const val = deltaObj[key];

        // Filter out undefined/null in updates to preserve existing healthy branches
        if (val === undefined || val === null) {
          continue;
        }

        const existingVal = result[key];
        if (
          existingVal !== undefined && existingVal !== null &&
          typeof existingVal === 'object' && typeof val === 'object'
        ) {
          result[key] = RuntimeStateReconciler.deepMergeStable(existingVal, val);
        } else {
          result[key] = val;
        }
      }
      return result as unknown as T;
    }

    return incomingDelta !== undefined && incomingDelta !== null ? (incomingDelta as unknown as T) : existingState;
  }
}
