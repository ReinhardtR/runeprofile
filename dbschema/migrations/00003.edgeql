CREATE MIGRATION m1dsd3cokxblfbk64lfjg5skvmspaqqjj4j4ntouobrqxypw7jyd3a
    ONTO m1dvuqlfylsaqhlr2qflhre4kmxs7zrdphp2oujhkspxxqnqdtrstq
{
  ALTER TYPE default::Account {
      CREATE REQUIRED PROPERTY description -> std::str {
          SET REQUIRED USING (<std::str>'');
      };
  };
};
