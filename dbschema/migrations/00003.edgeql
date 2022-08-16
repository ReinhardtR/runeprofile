CREATE MIGRATION m1kubypqmdtz7ireikhtpkjxgvp2ovtlj7bqh54amwilxrpedmiviq
    ONTO m1csaanybsu2h23urxmcp34bsezjuk3sag5migeswiykzjyjrfh2wa
{
  ALTER TYPE default::CollectionLog {
      ALTER LINK account {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE default::Entry {
      ALTER LINK tab {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
  ALTER TYPE default::Item {
      ALTER LINK entry {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
  ALTER TYPE default::Tab {
      ALTER LINK collection_log {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
};
