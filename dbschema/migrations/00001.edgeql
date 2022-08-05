CREATE MIGRATION m1xdswfhyirjrghebtrauirh5j22yb2tmxogsekrlxt7n4byso55sq
    ONTO initial
{
  CREATE ABSTRACT TYPE default::DateTracking {
      CREATE REQUIRED PROPERTY created_at -> std::datetime {
          SET default := (SELECT
              std::datetime_current()
          );
      };
      CREATE REQUIRED PROPERTY updated_at -> std::datetime;
  };
  CREATE SCALAR TYPE default::AccountType EXTENDING enum<NORMAL, IRONMAN, HARDCORE_IRONMAN, ULTIMATE_IRONMAN, GROUP_IRONMAN, HARDCORE_GROUP_IRONMAN, UNRANKED_GROUP_IRONMAN>;
  CREATE SCALAR TYPE default::ProgressState EXTENDING enum<NOT_STARTED, IN_PROGRESS, FINISHED>;
  CREATE TYPE default::Account EXTENDING default::DateTracking {
      CREATE REQUIRED PROPERTY achievement_diaries -> array<tuple<area: std::str, Easy: tuple<completed: std::int16, total: std::int16>, Medium: tuple<completed: std::int16, total: std::int16>, Hard: tuple<completed: std::int16, total: std::int16>, Elite: tuple<completed: std::int16, total: std::int16>>>;
      CREATE REQUIRED PROPERTY skills -> array<tuple<name: std::str, xp: std::int32>>;
      CREATE REQUIRED PROPERTY account_hash -> std::int64 {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY account_type -> default::AccountType;
      CREATE REQUIRED PROPERTY combat_achievements -> tuple<Easy: tuple<completed: std::int16, total: std::int16>, Medium: tuple<completed: std::int16, total: std::int16>, Hard: tuple<completed: std::int16, total: std::int16>, Elite: tuple<completed: std::int16, total: std::int16>, Master: tuple<completed: std::int16, total: std::int16>, Grandmaster: tuple<completed: std::int16, total: std::int16>>;
      CREATE REQUIRED PROPERTY model -> tuple<obj: std::bytes, mtl: std::bytes>;
      CREATE REQUIRED PROPERTY quest_list -> tuple<points: std::int16, quests: array<tuple<name: std::str, state: default::ProgressState>>>;
      CREATE REQUIRED PROPERTY username -> std::str {
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
  };
  CREATE TYPE default::CollectionLog {
      CREATE REQUIRED LINK account -> default::Account {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY unique_items_obtained -> std::int16;
      CREATE REQUIRED PROPERTY unique_items_total -> std::int16;
  };
  CREATE TYPE default::Tab {
      CREATE REQUIRED LINK collection_log -> default::CollectionLog;
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE CONSTRAINT std::exclusive ON ((.collection_log, .name));
  };
  CREATE TYPE default::Entry EXTENDING default::DateTracking {
      CREATE PROPERTY kill_counts -> array<tuple<name: std::str, count: std::int32>>;
      CREATE REQUIRED LINK tab -> default::Tab;
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE CONSTRAINT std::exclusive ON ((.tab, .name));
  };
  ALTER TYPE default::Account {
      CREATE LINK collection_log := (.<account[IS default::CollectionLog]);
  };
  CREATE TYPE default::Item {
      CREATE REQUIRED LINK entry -> default::Entry;
      CREATE REQUIRED PROPERTY item_id -> std::int32;
      CREATE CONSTRAINT std::exclusive ON ((.entry, .item_id));
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE PROPERTY obtained_at_kill_counts -> tuple<date: std::datetime, kill_counts: array<tuple<name: std::str, count: std::int32>>>;
      CREATE REQUIRED PROPERTY quantity -> std::int32;
  };
};
