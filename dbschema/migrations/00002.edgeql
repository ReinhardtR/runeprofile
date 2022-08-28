CREATE MIGRATION m1dvuqlfylsaqhlr2qflhre4kmxs7zrdphp2oujhkspxxqnqdtrstq
    ONTO m176jiq43rxgfyjnrd7cnjhaprjseq2xjo7tge5jxes3g6b66uhmua
{
  ALTER TYPE default::Account {
      CREATE REQUIRED PROPERTY combat_level -> std::int16 {
          SET REQUIRED USING (<std::int16>0);
      };
  };
};
