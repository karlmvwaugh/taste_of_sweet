
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



var slowSynth = function(id, freq) {
    __().sine({id: "sine" + id, frequency: freq})
        .lowpass({id: "lowpass" + id, frequency:200,q:10})
        .delay({delay: 2, feedback: 0.3, cutoff: 500, id: "delay" + id})
        .reverb({seconds: 3, decay: 1})
        .gain({id: "masterGain" + id, gain: 0})
        .dac();

     __().lfo({id: "lfodelay" + id, frequency:0.001,modulates:"feedback",gain:0.1,type:"sine"}).connect("#delay" + id);
     __().lfo({id: "lfolowpass" + id, frequency:0.0001,modulates:"q",gain:10,type:"sine"}).connect("#lowpass" + id);
    __().lfo({id: "lfolowpassfreq" + id, frequency:0.0003,modulates:"frequency",gain:10,type:"sine"}).connect("#lowpass" + id);

};

var synthRamp = function(id, freqEnd, time) {
    __("#sine" + id).ramp(freqEnd,time,"frequency");

     __("#lfodelay" + id).ramp(0.4,time,"gain");
     __("#lfolowpass" + id).ramp(100,time,"gain");
};


const control = {
    init: function() {
        if (initted){
            return;
        }
        initted = true;


//FIRST WEIRD BEAT
        var time = 30*60;

        slowSynth(1, 50);
        slowSynth(2, 50);

        slowSynth(3, 75);
        slowSynth(4, 75);

        console.log("Playing");
        __("sine").play();

        setTimeout(() => {
            [1, 2, 3, 4].map(id => __("#masterGain" + id).ramp(0.01, 5, "gain"));
            console.log("Turning Up");
        }, 1000);

        setTimeout(() => {
            synthRamp(1, 60, time);
            synthRamp(2, 120, time);
            synthRamp(3, 90, time);
            synthRamp(4, 180, time);
        }, 1000);

        setTimeout(() => {
            [1, 2, 3, 4].map(id => __("#sine" + id).stop());
        },time*1000);

        //fade in
        //fade out
    }
};

container = visuals.initD3();
