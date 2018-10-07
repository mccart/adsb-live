const net = require("net");
const oboe = require("oboe");
const Rx = require("rxjs/Rx");

module.exports = ({
  host = "pub-vrs.adsbexchange.com",
  port = 32001,
  socketFactory = net.Socket
} = {}) => {
  return new Rx.Observable(observer => {
    //Debugging
    let count = 0;
    let p1 = null;
    let p2 = null;
    let lastData = null;
    const socket = new socketFactory();
    socket.on("error", err => {
      console.log(err);
      observer.error(err);
    });
    socket.on("data", data => (lastData = data)); //process.stdout.write(data.toString()))
    oboe(socket)
      .on("fail", err => {
        console.log("FAILED AFTER", count);
        console.log("LAST DATA: ");
        console.log(lastData.toString());
        console.log(p2);
        console.log(p1);
        console.log(err);
        observer.error(err);
      })
      .on("node", {
        acList: d => {
          console.log("=================FULL MESSAGE=================");
        },
        "acList.*": d => {
          p2 = p1;
          p1 = d;
          count += 1;
          observer.next(d);
        }
      });

    socket.connect({ host, port });
    return () => socket.destroy();
  });
};
