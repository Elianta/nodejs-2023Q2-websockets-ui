export class User {
  private static index = 1;
  name: string;
  password: string;
  index: number;

  constructor(name: string, password: string) {
    this.name = name;
    this.password = password;
    this.index = User.index;
    User.index += 2;
  }
}
