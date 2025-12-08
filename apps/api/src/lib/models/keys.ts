export const createPlayerModelKey = (username: string) =>
  username.toLowerCase();
export const createPetModelKey = (username: string) =>
  `${username.toLowerCase()}-pet`;
