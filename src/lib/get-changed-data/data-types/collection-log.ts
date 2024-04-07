export type CollectionLogPageChange = {
  tabName: string;
  pageName: string;
  orderIdx: number;
};

export type GetCollectionLogPageChangesInputData = {
  tabName: string;
  pageName: string;
  orderIdx: number;
}[];

export function getCollectionLogPageChanges(
  oldData: GetCollectionLogPageChangesInputData | undefined,
  newData: GetCollectionLogPageChangesInputData
): CollectionLogPageChange[] {
  const changes: CollectionLogPageChange[] = [];

  for (const newPage of newData) {
    const oldPage = oldData?.find((p) => p.pageName === newPage.pageName);

    if (
      !oldPage || //
      oldPage.tabName !== newPage.tabName ||
      oldPage.orderIdx !== newPage.orderIdx
    ) {
      changes.push({
        tabName: newPage.tabName,
        pageName: newPage.pageName,
        orderIdx: newPage.orderIdx,
      });
      continue;
    }
  }

  return changes;
}

export type CollectionLogPageKillCountChange = {
  pageName: string;
  label: string;
  orderIdx: number;
};

export type GetCollectionLogPageKillCountChangesInputDataOld = {
  pageName: string;
  label: string;
  orderIdx: number;
}[];

export type GetCollectionLogPageKillCountChangesInputDataNew =
  GetCollectionLogPageKillCountChangesInputDataOld;

export function getCollectionLogPageKillCountChanges(
  oldData: GetCollectionLogPageKillCountChangesInputDataOld | undefined,
  newData: GetCollectionLogPageKillCountChangesInputDataNew
): CollectionLogPageKillCountChange[] {
  const changes: CollectionLogPageKillCountChange[] = [];

  for (const newKillCount of newData) {
    const oldKillCount = oldData?.find(
      (kc) =>
        kc.pageName === newKillCount.pageName && //
        kc.label === newKillCount.label
    );

    if (
      !oldKillCount || //
      oldKillCount.orderIdx !== newKillCount.orderIdx
    ) {
      changes.push({
        pageName: newKillCount.pageName,
        label: newKillCount.label,
        orderIdx: newKillCount.orderIdx,
      });
      continue;
    }
  }

  return changes;
}

export type CollectionLogPageItemChange = {
  pageName: string;
  itemId: number;
  orderIdx: number;
};

export type GetCollectionLogPageItemChangesInputDataOld = {
  pageName: string;
  itemId: number;
  orderIdx: number;
}[];

export type GetCollectionLogPageItemChangesInputDataNew =
  GetCollectionLogPageItemChangesInputDataOld;

export function getCollectionLogPageItemChanges(
  oldData: GetCollectionLogPageItemChangesInputDataOld | undefined,
  newData: GetCollectionLogPageItemChangesInputDataNew
): CollectionLogPageItemChange[] {
  const changes: CollectionLogPageItemChange[] = [];

  for (const newItem of newData) {
    const oldItem = oldData?.find(
      (i) =>
        i.pageName === newItem.pageName && //
        i.itemId === newItem.itemId
    );

    if (
      !oldItem || //
      oldItem.orderIdx !== newItem.orderIdx
    ) {
      changes.push({
        pageName: newItem.pageName,
        itemId: newItem.itemId,
        orderIdx: newItem.orderIdx,
      });
      continue;
    }
  }

  return changes;
}

export type CollectionLogItemChange = {
  id: number;
  name: string;
};

export type GetCollectionLogItemChangesInputData = {
  id: number;
  name: string;
}[];

export function getCollectionLogItemChanges(
  oldData: GetCollectionLogItemChangesInputData | undefined,
  newData: GetCollectionLogItemChangesInputData
): CollectionLogItemChange[] {
  const changes: CollectionLogItemChange[] = [];

  for (const newItem of newData) {
    const oldItem = oldData?.find((i) => i.id === newItem.id);

    if (
      !oldItem || //
      oldItem.name !== newItem.name
    ) {
      changes.push({
        id: newItem.id,
        name: newItem.name,
      });
      continue;
    }
  }

  return changes;
}

export type AccountCollectionLogItemChange = {
  itemId: number;
  quantity: number;
  newlyObtained?: {
    kcs: {
      label: string;
      count: number;
    }[];
  };
};

export type GetAccountCollectionLogItemChangesInputDataOld = {
  itemId: number;
  quantity: number;
  kcs: {
    label: string;
    count: number;
  }[];
}[];

export type GetAccountCollectionLogItemChangesInputDataNew =
  GetAccountCollectionLogItemChangesInputDataOld;

export function getAccountCollectionLogItemChanges(
  oldData: GetAccountCollectionLogItemChangesInputDataOld | undefined,
  newData: GetAccountCollectionLogItemChangesInputDataNew
): AccountCollectionLogItemChange[] {
  const changes: AccountCollectionLogItemChange[] = [];

  for (const newItem of newData) {
    const oldItem = oldData?.find((i) => i.itemId === newItem.itemId);

    if (
      !oldItem || //
      oldItem.quantity < newItem.quantity
    ) {
      const existingChange = changes.find((c) => c.itemId === newItem.itemId);
      const newlyObtained =
        (!oldItem || oldItem.quantity === 0) && newItem.quantity > 0;

      if (existingChange) {
        existingChange.quantity = Math.max(
          existingChange.quantity,
          newItem.quantity
        );
        existingChange.newlyObtained = existingChange.newlyObtained
          ? {
              kcs: [
                ...existingChange.newlyObtained.kcs,
                ...newItem.kcs.filter(
                  (kc) =>
                    !existingChange.newlyObtained!.kcs.some(
                      (ekc) => ekc.label === kc.label
                    )
                ),
              ],
            }
          : newlyObtained && newItem.kcs.length > 0
            ? { kcs: newItem.kcs }
            : undefined;
      } else {
        changes.push({
          itemId: newItem.itemId,
          quantity: newItem.quantity,
          newlyObtained:
            newlyObtained && newItem.kcs.length > 0
              ? { kcs: newItem.kcs }
              : undefined,
        });
      }
    }
  }

  return changes;
}

export type AccountCollectionLogPageKillCountChange = {
  label: string;
  count: number;
};

export type GetAccountCollectionLogPageKillCountChangesInputDataOld = {
  label: string;
  count: number;
}[];

export type GetAccountCollectionLogPageKillCountChangesInputDataNew =
  GetAccountCollectionLogPageKillCountChangesInputDataOld;

export function getAccountCollectionLogPageKillCountChanges(
  oldData: GetAccountCollectionLogPageKillCountChangesInputDataOld | undefined,
  newData: GetAccountCollectionLogPageKillCountChangesInputDataNew
): AccountCollectionLogPageKillCountChange[] {
  const changes: AccountCollectionLogPageKillCountChange[] = [];

  for (const newKillCount of newData) {
    const oldKillCount = oldData?.find((kc) => kc.label === newKillCount.label);

    if (
      !oldKillCount || //
      oldKillCount.count < newKillCount.count
    ) {
      const existingChange = changes.find(
        (c) => c.label === newKillCount.label
      );

      if (existingChange) {
        existingChange.count = Math.max(
          existingChange.count,
          newKillCount.count
        );
      } else {
        changes.push({
          label: newKillCount.label,
          count: newKillCount.count,
        });
      }
    }
  }

  return changes;
}
