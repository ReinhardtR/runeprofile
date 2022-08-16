CREATE MIGRATION m1csaanybsu2h23urxmcp34bsezjuk3sag5migeswiykzjyjrfh2wa
    ONTO m1xdswfhyirjrghebtrauirh5j22yb2tmxogsekrlxt7n4byso55sq
{
  ALTER TYPE default::Account {
      ALTER PROPERTY model {
          SET TYPE std::bytes USING (<std::bytes>.model.obj);
      };
  };
  ALTER TYPE default::CollectionLog {
      CREATE MULTI LINK tabs := (.<collection_log[IS default::Tab]);
  };
  ALTER TYPE default::Entry {
      CREATE MULTI LINK items := (.<entry[IS default::Item]);
  };
  ALTER TYPE default::Tab {
      CREATE MULTI LINK entries := (.<tab[IS default::Entry]);
  };
};
