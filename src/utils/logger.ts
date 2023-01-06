class Logger {
  public info(msg: string) {
    this.log("INFO", msg);
  }

  public warn(msg: string) {
    this.log("WARN", msg);
  }

  public error(msg: string) {
    this.log("ERROR", msg);
  }

  private log(prefix: string, msg: any) {
    console.log(`${prefix}  ${msg}`);
  }
}

export default new Logger();
