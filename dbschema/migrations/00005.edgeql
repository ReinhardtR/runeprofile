CREATE MIGRATION m12l5yqxflokbq7uaoq6sttprt6xatnlinysryxowh476kpnvvgyrq
    ONTO m1bdctsq4g65f6lkl7xfdlearywrthcxavaqjxpp7y2yrqj5r3sg2a
{
  ALTER TYPE default::Account {
      ALTER PROPERTY model {
          SET TYPE std::str USING (<std::str>{});
      };
  };
};
