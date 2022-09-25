CREATE MIGRATION m1mrmoyr3pgaeom5arylftk3muzjp25c3os73nxfctq5scooe2enna
    ONTO m1dybxg3i6att52iio7or3sdd5yowcvguocg4pri6jb25z4xosyf6q
{
  ALTER TYPE default::Account {
      ALTER PROPERTY generated_path {
          DROP CONSTRAINT std::min_len_value(1);
      };
  };
  ALTER TYPE default::Account {
      ALTER PROPERTY generated_path {
          CREATE CONSTRAINT std::min_len_value(13);
      };
      ALTER PROPERTY username {
          CREATE CONSTRAINT std::max_len_value(12);
      };
  };
  ALTER TYPE default::Tab {
      CREATE REQUIRED PROPERTY index -> std::int16 {
          SET REQUIRED USING (<std::int16>0);
      };
  };
};
