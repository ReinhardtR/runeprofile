module default {
  type Account extending DateTracking {
    required property account_hash -> int64 {
      constraint exclusive;
    }

    required property username -> str {
      constraint exclusive;
      constraint min_len_value(1);
      constraint max_len_value(12);
    }

    # Max username length is 12 characters,
    # so the path is 13 to avoid collisions.
    property generated_path -> str {
      constraint exclusive;
      constraint min_len_value(13); 
    }

    required property is_private -> bool {
      default := false;
    }

    required property account_type -> AccountType;

    # 3D Character Model
    required property model -> str;

    required property description -> str;

    required property combat_level -> int16;

    required property skills -> array<tuple<name: str, xp: int32>>;

    required property achievement_diaries -> array<
      tuple<
        area: str,
        Easy: tuple<completed: int16, total: int16>,
        Medium: tuple<completed: int16, total: int16>,
        Hard: tuple<completed: int16, total: int16>,
        Elite: tuple<completed: int16, total: int16>
      >
    >;

    required property combat_achievements -> tuple<
      Easy: tuple<completed: int16, total: int16>,
      Medium: tuple<completed: int16, total: int16>,
      Hard: tuple<completed: int16, total: int16>,
      Elite: tuple<completed: int16, total: int16>,
      Master: tuple<completed: int16, total: int16>,
      Grandmaster: tuple<completed: int16, total: int16>
    >;

    required property quest_list -> tuple<
      points: int16,
      quests: tuple<
        f2p: array<tuple<name: str, state: ProgressState>>,
        p2p: array<tuple<name: str, state: ProgressState>>,
        mini: array<tuple<name: str, state: ProgressState>>,
        unknown: array<tuple<name: str, state: ProgressState>>
      >,
    >;

    required property hiscores -> tuple<
      normal: tuple<
        skills: array<tuple<name: str, rank: int32, level: int16, xp: int64>>,
        activities: array<tuple<name: str, rank: int32, score: int32>>,
        bosses: array<boss: tuple<name: str, rank: int32, kills: int32>>,
      >,
      ironman: tuple<
        skills: array<tuple<name: str, rank: int32, level: int16, xp: int64>>,
        activities: array<tuple<name: str, rank: int32, score: int32>>,
        bosses: array<boss: tuple<name: str, rank: int32, kills: int32>>,
      >,
      hardcore: tuple<
        skills: array<tuple<name: str, rank: int32, level: int16, xp: int64>>,
        activities: array<tuple<name: str, rank: int32, score: int32>>,
        bosses: array<boss: tuple<name: str, rank: int32, kills: int32>>,
      >,
      ultimate: tuple<
        skills: array<tuple<name: str, rank: int32, level: int16, xp: int64>>,
        activities: array<tuple<name: str, rank: int32, score: int32>>,
        bosses: array<boss: tuple<name: str, rank: int32, kills: int32>>,
      >,
    >;

    link collection_log := .<account[is CollectionLog];
  }

  # Collection Log
  type CollectionLog {
    required property unique_items_obtained -> int16;
    required property unique_items_total -> int16;

    required link account -> Account {
      constraint exclusive;
      on target delete delete source;
    }

    multi link tabs := .<collection_log[is Tab];
  }

  # Tab (e.g.: Bosses)
  type Tab {
    required property index -> int16;
    required property name -> str;
  
    required link collection_log -> CollectionLog {
      on target delete delete source;
    }
    
    multi link entries := .<tab[is Entry];

    constraint exclusive on ((.collection_log, .name))
  }

  # Entry (e.g.: Abyssal Sire)
  type Entry extending DateTracking {
    required property index -> int16;
    required property name -> str;

    property kill_counts -> array<tuple<name: str, count: int32>>;

    required link tab -> Tab {
      on target delete delete source;
    }

    multi link items := .<entry[is Item];

    constraint exclusive on ((.tab, .name));
  }

  # Item (e.g.: Abyssal Whip)
  type Item {
    # The id of the item in-game and isn't unique here.
    required property index -> int16;
    required property item_id -> int32;
    required property name -> str;
    required property quantity -> int32;

    property obtained_at_kill_counts -> tuple<
      date: datetime,
      kill_counts: array<
        tuple<name: str, count: int32>
      >
    >;

    required link entry -> Entry {
      on target delete delete source;
    }

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

  scalar type HiscoreType extending enum<
    SKILL,
    ACTIVITY,
    BOSS
  >;

  scalar type LeaderboardType extending enum<
    NORMAL,
    IRONMAN,
    HARDCORE,
    ULTIMATE,
  >;

  scalar type ProgressState extending enum<NOT_STARTED, IN_PROGRESS, FINISHED>;
}
