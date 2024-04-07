import { describe, expect, test } from "vitest";

import {
  AccountCollectionLogItemChange,
  AccountCollectionLogPageKillCountChange,
  CollectionLogItemChange,
  CollectionLogPageChange,
  CollectionLogPageItemChange,
  CollectionLogPageKillCountChange,
  getAccountCollectionLogItemChanges,
  getAccountCollectionLogPageKillCountChanges,
  getCollectionLogItemChanges,
  getCollectionLogPageChanges,
  getCollectionLogPageItemChanges,
  getCollectionLogPageKillCountChanges,
} from "./collection-log";

describe("getCollectionLogPageChanges", () => {
  test("new page added", () => {
    const result = getCollectionLogPageChanges(
      [
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 0,
        },
      ],
      [
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 0,
        },
        {
          tabName: "Bosses",
          pageName: "Alchemical Hydra",
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageChange[]>([
      {
        tabName: "Bosses",
        pageName: "Alchemical Hydra",
        orderIdx: 1,
      },
    ]);
  });

  test("page order changed", () => {
    const result = getCollectionLogPageChanges(
      [
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 0,
        },
        {
          tabName: "Bosses",
          pageName: "Alchemical Hydra",
          orderIdx: 1,
        },
      ],
      [
        {
          tabName: "Bosses",
          pageName: "Alchemical Hydra",
          orderIdx: 0,
        },
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageChange[]>([
      {
        tabName: "Bosses",
        pageName: "Alchemical Hydra",
        orderIdx: 0,
      },
      {
        tabName: "Bosses",
        pageName: "Abyssal Sire",
        orderIdx: 1,
      },
    ]);
  });

  test("no changes", () => {
    const result = getCollectionLogPageChanges(
      [
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 0,
        },
      ],
      [
        {
          tabName: "Bosses",
          pageName: "Abyssal Sire",
          orderIdx: 0,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageChange[]>([]);
  });
});

describe("getCollectionLogPageKillCountChanges", () => {
  test("new kill count added", () => {
    const result = getCollectionLogPageKillCountChanges(
      [
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 0,
        },
      ],
      [
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 0,
        },
        {
          pageName: "Bosses",
          label: "Alchemical Hydra",
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageKillCountChange[]>([
      {
        pageName: "Bosses",
        label: "Alchemical Hydra",
        orderIdx: 1,
      },
    ]);
  });

  test("kill count order changed", () => {
    const result = getCollectionLogPageKillCountChanges(
      [
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 0,
        },
        {
          pageName: "Bosses",
          label: "Alchemical Hydra",
          orderIdx: 1,
        },
      ],
      [
        {
          pageName: "Bosses",
          label: "Alchemical Hydra",
          orderIdx: 0,
        },
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageKillCountChange[]>([
      {
        pageName: "Bosses",
        label: "Alchemical Hydra",
        orderIdx: 0,
      },
      {
        pageName: "Bosses",
        label: "Abyssal Sire",
        orderIdx: 1,
      },
    ]);
  });

  test("no changes", () => {
    const result = getCollectionLogPageKillCountChanges(
      [
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 0,
        },
      ],
      [
        {
          pageName: "Bosses",
          label: "Abyssal Sire",
          orderIdx: 0,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageKillCountChange[]>([]);
  });
});

describe("getCollectionLogPageItemChanges", () => {
  test("new item added", () => {
    const result = getCollectionLogPageItemChanges(
      [
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 0,
        },
      ],
      [
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 0,
        },
        {
          pageName: "Unsired",
          itemId: 2,
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageItemChange[]>([
      {
        pageName: "Unsired",
        itemId: 2,
        orderIdx: 1,
      },
    ]);
  });

  test("item order changed", () => {
    const result = getCollectionLogPageItemChanges(
      [
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 0,
        },
        {
          pageName: "Unsired",
          itemId: 2,
          orderIdx: 1,
        },
      ],
      [
        {
          pageName: "Unsired",
          itemId: 2,
          orderIdx: 0,
        },
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 1,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageItemChange[]>([
      {
        pageName: "Unsired",
        itemId: 2,
        orderIdx: 0,
      },
      {
        pageName: "Abyssal Whip",
        itemId: 1,
        orderIdx: 1,
      },
    ]);
  });

  test("no changes", () => {
    const result = getCollectionLogPageItemChanges(
      [
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 0,
        },
      ],
      [
        {
          pageName: "Abyssal Whip",
          itemId: 1,
          orderIdx: 0,
        },
      ]
    );

    expect(result).toEqual<CollectionLogPageItemChange[]>([]);
  });
});

describe("getCollectionLogItemChanges", () => {
  test("new item added", () => {
    const result = getCollectionLogItemChanges(
      [
        {
          id: 1,
          name: "Abyssal Whip",
        },
      ],
      [
        {
          id: 1,
          name: "Abyssal Whip",
        },
        {
          id: 2,
          name: "Unsired",
        },
      ]
    );

    expect(result).toEqual<CollectionLogItemChange[]>([
      {
        id: 2,
        name: "Unsired",
      },
    ]);
  });

  test("item name changed", () => {
    const result = getCollectionLogItemChanges(
      [
        {
          id: 1,
          name: "Abyssal Whip",
        },
        {
          id: 2,
          name: "Unsired",
        },
      ],
      [
        {
          id: 1,
          name: "Abyssal Tentacle",
        },
        {
          id: 2,
          name: "Unsired",
        },
      ]
    );

    expect(result).toEqual<CollectionLogItemChange[]>([
      {
        id: 1,
        name: "Abyssal Tentacle",
      },
    ]);
  });

  test("no changes", () => {
    const result = getCollectionLogItemChanges(
      [
        {
          id: 1,
          name: "Abyssal Whip",
        },
      ],
      [
        {
          id: 1,
          name: "Abyssal Whip",
        },
      ]
    );

    expect(result).toEqual<CollectionLogItemChange[]>([]);
  });
});

describe("getAccountCollectionLogItemChanges", () => {
  test("new item tracked", () => {
    const result = getAccountCollectionLogItemChanges(
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [],
        },
      ],
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [],
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogItemChange[]>([
      {
        itemId: 2,
        quantity: 0,
      },
    ]);
  });

  test("item quantity changed", () => {
    const result = getAccountCollectionLogItemChanges(
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [],
        },
      ],
      [
        {
          itemId: 1,
          quantity: 2,
          kcs: [],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [],
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogItemChange[]>([
      {
        itemId: 1,
        quantity: 2,
      },
    ]);
  });

  test("already tracked item obtained", () => {
    const result = getAccountCollectionLogItemChanges(
      [
        {
          itemId: 1,
          quantity: 0,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 10,
            },
          ],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 10,
            },
          ],
        },
      ],
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 20,
            },
          ],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 20,
            },
          ],
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogItemChange[]>([
      {
        itemId: 1,
        quantity: 1,
        newlyObtained: {
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 20,
            },
          ],
        },
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountCollectionLogItemChanges(
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 10,
            },
          ],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [],
        },
      ],
      [
        {
          itemId: 1,
          quantity: 1,
          kcs: [
            {
              label: "Abyssal Sire kills",
              count: 10,
            },
          ],
        },
        {
          itemId: 2,
          quantity: 0,
          kcs: [],
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogItemChange[]>([]);
  });
});

describe("getAccountCollectionLogPageKillCountChanges", () => {
  test("new kill count tracked", () => {
    const result = getAccountCollectionLogPageKillCountChanges(
      [
        {
          label: "Abyssal Sire kills",
          count: 10,
        },
      ],
      [
        {
          label: "Abyssal Sire kills",
          count: 10,
        },
        {
          label: "Alchemical Hydra kills",
          count: 0,
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogPageKillCountChange[]>([
      {
        label: "Alchemical Hydra kills",
        count: 0,
      },
    ]);
  });

  test("kill count changed", () => {
    const result = getAccountCollectionLogPageKillCountChanges(
      [
        {
          label: "Abyssal Sire kills",
          count: 10,
        },
        {
          label: "Alchemical Hydra kills",
          count: 0,
        },
      ],
      [
        {
          label: "Abyssal Sire kills",
          count: 11,
        },
        {
          label: "Alchemical Hydra kills",
          count: 0,
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogPageKillCountChange[]>([
      {
        label: "Abyssal Sire kills",
        count: 11,
      },
    ]);
  });

  test("no changes", () => {
    const result = getAccountCollectionLogPageKillCountChanges(
      [
        {
          label: "Abyssal Sire kills",
          count: 10,
        },
        {
          label: "Alchemical Hydra kills",
          count: 0,
        },
      ],
      [
        {
          label: "Abyssal Sire kills",
          count: 10,
        },
        {
          label: "Alchemical Hydra kills",
          count: 0,
        },
      ]
    );

    expect(result).toEqual<AccountCollectionLogPageKillCountChange[]>([]);
  });

  test("");
});
