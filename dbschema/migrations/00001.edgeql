CREATE MIGRATION m1scbwruaidi2m4n3pi4qxngdekn77thamqhnmmd5v5kmqgtwqxtpa
    ONTO initial
{
    CREATE TYPE default::Person {
        CREATE REQUIRED PROPERTY name -> std::str;
    };
};
