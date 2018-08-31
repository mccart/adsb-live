const net = require("net");
const oboe = require("oboe");
const Rx = require("rxjs/Rx");

module.exports = ({
  host = "pub-vrs.adsbexchange.com",
  port = 32015,
  socketFactory = net.Socket
} = {}) => {
  return new Rx.Observable(observer => {
    const socket = new socketFactory();
    socket.on("error", err => {
      console.log(err);
      observer.error(err);
    });
    //socket.on("data", (data) => console.log(data.length))
    oboe(socket)
      .on("fail", err => {
        console.log(err);
        observer.error(err);
      })
      .on("node", {
        "!": data => {
          if (data.acList) {
            for (let d of data.acList) {
              observer.next(d);
            }
          }
        }
      });

    socket.connect({ host, port });
    return () => socket.destroy();
  });
};
