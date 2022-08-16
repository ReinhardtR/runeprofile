CREATE MIGRATION m1bdctsq4g65f6lkl7xfdlearywrthcxavaqjxpp7y2yrqj5r3sg2a
    ONTO m1kubypqmdtz7ireikhtpkjxgvp2ovtlj7bqh54amwilxrpedmiviq
{
  ALTER TYPE default::Item {
      ALTER LINK entry {
          RESET ON SOURCE DELETE;
          ON TARGET DELETE DELETE SOURCE;
      };
  };
};
