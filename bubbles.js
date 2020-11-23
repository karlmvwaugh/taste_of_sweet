
var initted = false;

var beginningFrequency = 100;
var rampTime = 4;
var gain = 0.03;

var container = null;


var utils = {
    getRandom: function(min, max) {
        return Math.random() * (max - min + 1) + min;
    },
    lerper: function(value1, value2, range) {
        var i = utils.getRandomInt(range);
        var plus = true;

        var nextIValue = function() {
            if (plus) {
                i = i + 1;
            } else {
                i = i -1;
            }

            if (i < 0) {
                i = 0;
                plus = true;
            }
            if (i > range) {
                i = range;
                plus = false;
            }
        };

        var funky = function(){
            var value = (i / range)*(value2 - value1) + value1;
            nextIValue();
            return value;
        };

        funky.set = function(j) {
            i = j;
            return funky;
        };

        return funky;
    }
};

const visuals = {
    initD3: function() {
        var width = document.body.clientWidth;
        var height = document.body.clientHeight;
        if (height < 1000) {
            height = 1000;
        }
        console.log(width + ":" + height);
        var centre = {x: width/2, y: height/2};

        var svg = d3.select("#screen").append("svg").attr("width",width).attr("height", height);
        var screen = d3.select("#screen");
        screen.style("background", "#010203");

        var container = svg.append("g")
            .attr("transform", "translate(" + centre.x + ","  + 0 + ")");
        //      .attr("transform", "translate(" + centre.x + ","  + centre.y + ")");

        return container;
    }
};



var beatSynth = function(id, freq, speed, noteSpeed, masterGain) {
    __().sine({id: "id" + id, frequency: freq}).gain({id: "gain" + id, gain: 1})
        .delay({delay: 2/speed, feedback: 0.3, cutoff: 1500, id: "delay" + id})
        .gain({id: "masterGain" + id, gain: masterGain})
        .dac();

    //__().square({id: "sq1", frequency: 0.1}).gain({gain:100,modulates:"frequency"}).connect("#id1");
    __().lfo({id: "lfofreq" + id, frequency:noteSpeed,modulates:"frequency",gain:150,type:"sine"}).connect("#id" + id);
    __().lfo({id: "lfogain" + id, frequency:speed,modulates:"gain",gain:2,type:"square"}).connect("#gain" + id);
    __().lfo({id: "lfodelay" + id, frequency:speed/4,modulates:"feedback",gain:1,type:"saw"}).connect("#delay" + id);
    __().lfo({id: "lfofreqfreq" + id, frequency:speed/8,modulates:"frequency",gain:0.1,type:"sine"}).connect("#lfofreq" + id);
};

var warbleSynth = function(id, withReverb, masterGain) {
    __().sine({id: "sine" + id, frequency: 50}).gain(1)
        .gain({id: "gain"  + id, gain: 1})
        .delay({delay: 3, feedback: 0.7, cutoff: 1000, id: "delay" + id});

    if (withReverb) {
     __.reverb({seconds: 3, decay: 1});
    }

    __.gain({id: "masterGain" + id, gain: masterGain})
        .dac();

    __().lfo({id: "lfofreq" + id, frequency:0.01 ,modulates:"frequency",gain:200,type:"sine"}).connect("#sine" + id);


    __().lfo({id: "lfodelay" + id, frequency:0.1 ,modulates:"delay",gain:7,type:"sine"}).connect("#delay" + id);
};

var kick = function(id, freq, masterGain) {
    __().square({id: "id" + id, frequency: freq}).gain({id: "gain" + id, gain: 1})
        .delay({delay: 1, feedback: 0.3, cutoff: 1500, id: "delay" + id})
        .gain({id: "masterGain" + id, gain: masterGain})
        .dac();
};


const control = {
    init: function() {
        if (initted){
            return;
        }
        initted = true;


//FIRST WEIRD BEAT
        beatSynth(1, 200, 4, 0.13, 0.5);
        warbleSynth(2, true, 0.8);
        warbleSynth(3, false, 0.1);
        beatSynth(4, 400, 16, 0.013, 0.1);
        kick(5, 0.5, 0.9);


        /*
        * VISUALS BASED ON artNew2 (from trippy visuals)
        * Add gaps (aka like if I go away from the page)
        * Interactivity
        * An end? Plus ramp up at the begininning 
        * */
/*
        var toSine = (id, freq, beat) => {
            __().sine({id: "id" + id, frequency: freq}).gain({id: "gain" + id, gain: 1})
                .delay({delay: 1, feedback: 0.3, cutoff: 1500, id: "delay" + id})
                .gain({id: "masterGain" + id, gain: 10})
                .dac();

            __().lfo({frequency:beat,modulates:"gain",gain:2,type:"square"}).connect("#gain" + id);

        };


        toSine(0, 100, 5);
        toSine(2, 300, 2.5);
*/


        __("sine").play();
    }
};

container = visuals.initD3();


//*
// TODO: make mouse moves reposition the circles within the frame. (cheap 3d) - top frame to middle, zoom in and zoom out slightly -
// Does this movement effect the music as well? mixing the volumes of the sinewaves?
// Add click me / intro screen
// correct height of original drawing problem (?)
// correct - sometimes starts with just one tone?
// END SCREEN and CREDITS + stats (how long etc. uniqueness etc.)
//
// *//
