export default class NotFoundError extends Error {
  constructor(resource: string) {
    super(`Resource "${resource}" not found"`);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, Error.prototype);
  }
}
