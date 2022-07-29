CREATE MIGRATION m1q5cqp35fm5jyfmae27tb6dyhhs2vdl7t2easdngumjtlowmzs63q
    ONTO initial
{
  CREATE TYPE default::Person {
      CREATE REQUIRED PROPERTY name -> std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
