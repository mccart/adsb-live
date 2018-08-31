const { Readable } = require("stream");
const adsbConnect = require("../src/adsbConnect");
import test from "ava";

class DummySocket extends Readable {
  constructor(opt) {
    super(opt);
  }
  connect() {}
  _read() {
    this.push(Buffer.from('{"acList": [1]}'));
    this.push(null);
  }
}

class FailingConnectionSocket extends DummySocket {
  connect() {
    throw new Error();
  }
}
class FailingUpdateSocket extends DummySocket {
  _read() {
    this.push(Buffer.from('{"acList": [1]'));
    this.push(null);
  }
}

test("Client can get updates", async t => {
  adsbConnect({ socketFactory: DummySocket }).subscribe(
    () => t.pass(),
    () => t.fail(),
    () => t.fail()
  );
});
test("Client emits error if the connection fails", async function(t) {
  adsbConnect({ socketFactory: FailingConnectionSocket }).subscribe(
    () => t.fail(),
    () => t.pass(),
    () => t.fail()
  );
});
test("Client emits error if there is a data error", async function(t) {
  adsbConnect({ socketFactory: FailingUpdateSocket }).subscribe(
    () => t.fail(),
    () => t.pass(),
    () => t.fail()
  );
});
