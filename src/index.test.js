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

class FailingConnectionSocket extends DummySocket {
  connect() {
    throw new Error();
  }
}
class FailingUpdateSocket extends DummySocket {
  _read() {
    throw new Error();
  }
}

/*
test('Client can get updates', done => {
  adsbConnect({socketFactory: DummySocket}).subscribe(
    updates => {
      expect(updates[0]).toBe(1);
      done();
    },
    error => {
      expect(true).toBe(false);
      done();
    },
    () => {
      console.log("Completed");
      done();
    }
  );
});
*/
test("Client emits error if the connection fails", done => {
  adsbConnect({ socketFactory: FailingConnectionSocket }).subscribe(
    updates => {
      expect(true).toBe(false);
      done();
    },
    error => {
      expect(true).toBe(true);
      done();
    },
    () => {
      expect(true).toBe(false);
      done();
    }
  );
});
/*
test('Client emits error if there is a data error', done => {
  adsbConnect({socketFactory: FailingUpdateSocket}).subscribe(
    updates => {
      expect(true).toBe(false);
      done();
    },
    error => {
      expect(true).toBe(true);
      done();
    },
    () => {
      expect(true).toBe(false);
      done();
    }
  );
});
*/
