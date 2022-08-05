module default {
  type Account extending DateTracking {
    # Account
    required property account_hash -> int64 {
      constraint exclusive;
    }

    required property username -> str {
      constraint exclusive;
      constraint min_len_value(1);
    }

    required property account_type -> AccountType;

    # 3D Character Model
    required property model -> tuple<obj: bytes, mtl: bytes>;

    # Skills
    required property skills -> array<tuple<name: str, xp: int32>>;

    # Achievement Diaries
    required property achievement_diaries -> array<
      tuple<
        area: str,
        Easy: tuple<completed: int16, total: int16>,
        Medium: tuple<completed: int16, total: int16>,
        Hard: tuple<completed: int16, total: int16>,
        Elite: tuple<completed: int16, total: int16>
      >
    >;

    # Combat Achievements
    required property combat_achievements -> tuple<
      Easy: tuple<completed: int16, total: int16>,
      Medium: tuple<completed: int16, total: int16>,
      Hard: tuple<completed: int16, total: int16>,
      Elite: tuple<completed: int16, total: int16>,
      Master: tuple<completed: int16, total: int16>,
      Grandmaster: tuple<completed: int16, total: int16>
    >;

    # Quests
    required property quest_list -> tuple<
      points: int16,
      quests: array<tuple<name: str, state: ProgressState>>
    >;

    link collection_log := .<account[is CollectionLog];
  }

  # Collection Log
  type CollectionLog {
    required property unique_items_obtained -> int16;
    required property unique_items_total -> int16;

    required link account -> Account {
      constraint exclusive;
    }
  }

  type Tab {
    required property name -> str;
  
    required link collection_log -> CollectionLog;

    constraint exclusive on ((.collection_log, .name))
  }

  type Entry extending DateTracking {
    required property name -> str;

    property kill_counts -> array<tuple<name: str, count: int32>>;

    required link tab -> Tab;

    constraint exclusive on ((.tab, .name));
  }

  type Item {
    # The id of the item in-game and isn't unique here.
    required property item_id -> int32;
    required property name -> str;
    required property quantity -> int32;

    property obtained_at_kill_counts -> tuple<
      date: datetime,
      kill_counts: array<
        tuple<name: str, count: int32>
      >
    >;

    required link entry -> Entry;

    constraint exclusive on ((.entry, .item_id))
  }

  # Utils
  abstract type DateTracking {
    required property created_at -> datetime {
      default := (SELECT datetime_current());
    }
    
    required property updated_at -> datetime;
  }

  scalar type AccountType extending enum<
    NORMAL,
    IRONMAN,
    HARDCORE_IRONMAN,
    ULTIMATE_IRONMAN,
    GROUP_IRONMAN,
    HARDCORE_GROUP_IRONMAN,
    UNRANKED_GROUP_IRONMAN
  >;

  scalar type ProgressState extending enum<NOT_STARTED, IN_PROGRESS, FINISHED>;
}
