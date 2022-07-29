module default {
  type Person {
    required property name -> str {
      constraint exclusive;
    }
  }
}
