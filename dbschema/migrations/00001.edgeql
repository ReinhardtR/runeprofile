CREATE MIGRATION m1dybxg3i6att52iio7or3sdd5yowcvguocg4pri6jb25z4xosyf6q
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
      CREATE REQUIRED PROPERTY combat_level -> std::int16;
      CREATE REQUIRED PROPERTY description -> std::str;
      CREATE PROPERTY generated_path -> std::str {
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
      CREATE REQUIRED PROPERTY hiscores -> tuple<normal: tuple<skills: array<tuple<name: std::str, rank: std::int32, level: std::int16, xp: std::int64>>, activities: array<tuple<name: std::str, rank: std::int32, score: std::int32>>, bosses: array<tuple<name: std::str, rank: std::int32, kills: std::int32>>>, ironman: tuple<skills: array<tuple<name: std::str, rank: std::int32, level: std::int16, xp: std::int64>>, activities: array<tuple<name: std::str, rank: std::int32, score: std::int32>>, bosses: array<tuple<name: std::str, rank: std::int32, kills: std::int32>>>, hardcore: tuple<skills: array<tuple<name: std::str, rank: std::int32, level: std::int16, xp: std::int64>>, activities: array<tuple<name: std::str, rank: std::int32, score: std::int32>>, bosses: array<tuple<name: std::str, rank: std::int32, kills: std::int32>>>, ultimate: tuple<skills: array<tuple<name: std::str, rank: std::int32, level: std::int16, xp: std::int64>>, activities: array<tuple<name: std::str, rank: std::int32, score: std::int32>>, bosses: array<tuple<name: std::str, rank: std::int32, kills: std::int32>>>>;
      CREATE REQUIRED PROPERTY is_private -> std::bool {
          SET default := false;
      };
      CREATE REQUIRED PROPERTY model -> std::str;
      CREATE REQUIRED PROPERTY quest_list -> tuple<points: std::int16, quests: tuple<f2p: array<tuple<name: std::str, state: default::ProgressState>>, p2p: array<tuple<name: std::str, state: default::ProgressState>>, mini: array<tuple<name: std::str, state: default::ProgressState>>, unknown: array<tuple<name: std::str, state: default::ProgressState>>>>;
      CREATE REQUIRED PROPERTY username -> std::str {
          CREATE CONSTRAINT std::exclusive;
          CREATE CONSTRAINT std::min_len_value(1);
      };
  };
  CREATE TYPE default::Entry EXTENDING default::DateTracking {
      CREATE PROPERTY kill_counts -> array<tuple<name: std::str, count: std::int32>>;
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE REQUIRED PROPERTY index -> std::int16;
  };
  CREATE TYPE default::CollectionLog {
      CREATE REQUIRED LINK account -> default::Account {
          ON TARGET DELETE DELETE SOURCE;
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE REQUIRED PROPERTY unique_items_obtained -> std::int16;
      CREATE REQUIRED PROPERTY unique_items_total -> std::int16;
  };
  ALTER TYPE default::Account {
      CREATE LINK collection_log := (.<account[IS default::CollectionLog]);
  };
  CREATE TYPE default::Tab {
      CREATE REQUIRED LINK collection_log -> default::CollectionLog {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE CONSTRAINT std::exclusive ON ((.collection_log, .name));
  };
  ALTER TYPE default::CollectionLog {
      CREATE MULTI LINK tabs := (.<collection_log[IS default::Tab]);
  };
  ALTER TYPE default::Entry {
      CREATE REQUIRED LINK tab -> default::Tab {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE CONSTRAINT std::exclusive ON ((.tab, .name));
  };
  CREATE TYPE default::Item {
      CREATE REQUIRED LINK entry -> default::Entry {
          ON TARGET DELETE DELETE SOURCE;
      };
      CREATE REQUIRED PROPERTY item_id -> std::int32;
      CREATE CONSTRAINT std::exclusive ON ((.entry, .item_id));
      CREATE REQUIRED PROPERTY index -> std::int16;
      CREATE REQUIRED PROPERTY name -> std::str;
      CREATE PROPERTY obtained_at_kill_counts -> tuple<date: std::datetime, kill_counts: array<tuple<name: std::str, count: std::int32>>>;
      CREATE REQUIRED PROPERTY quantity -> std::int32;
  };
  ALTER TYPE default::Entry {
      CREATE MULTI LINK items := (.<entry[IS default::Item]);
  };
  ALTER TYPE default::Tab {
      CREATE MULTI LINK entries := (.<tab[IS default::Entry]);
  };
  CREATE SCALAR TYPE default::HiscoreType EXTENDING enum<SKILL, ACTIVITY, BOSS>;
  CREATE SCALAR TYPE default::LeaderboardType EXTENDING enum<NORMAL, IRONMAN, HARDCORE, ULTIMATE>;
};
