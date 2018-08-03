const { Readable } = require("stream");
const adsbConnect = require("../src/index");

class DummySocket extends Readable {
  constructor(opt) {
    super(opt);
  }
  connect() {}
  _read() {
    this.push('{"acList": [1]}');
    this.push(null);
  }
}

const subscription = adsbConnect({ socketFactory: DummySocket }).subscribe(
  updates => console.log("Parsed", updates.length, "items"),
  error => console.log("Error", error),
  () => console.log("Complete")
);
