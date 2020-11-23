
var initted = false;

var beginningFrequency = 100;
var toGenerate = 66; //should be even?
var rampTime = 4;
var deathTimeRange = [2, 16];
var gain = 0.03;
var stepTime = rampTime * 1010;
var killLiklihood = 0.005;
var killLiklihoodLimit = 0.1;
var killLiklihoodStep = (killLiklihoodLimit - killLiklihood) / toGenerate;
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
    },
    kill: function(id, deathTime) {
        d3.select("#circle" + id).transition().duration(deathTime*1000)
            .attr("r", visuals.getRadius(300))
            .attr("stroke-width", utils.getRandom(100, 600) + "px")
            .attr("stroke", "#fe0102")
            .attr("cx", utils.getRandom(-2000, 2000))

            .attr("cy", utils.getRandom(-2000, 2000))
            .style("opacity", 0)
            .style()
            .ease("linear")
            .remove();
    },
    getRadius: function(initial) {
        var minFreq = 50;
        var maxFreq = 1000;

        var percentageThrough = (initial - minFreq)/(maxFreq - minFreq);

        var minSize = 10;
        var maxSize = 3000;

        return Math.abs(percentageThrough*(maxSize - minSize) + minSize);
    },
    initCircles:  function(d) {
        container.append("circle")
            .attr("id", "circle" + d.id)
            .attr("r", d.radius)
            .attr("fill", "none")
            .attr("stroke", "#ccbbaa")
            .attr("stroke-width", "1px")
            .attr("cx", 0)
            .attr("cy", 0)
            .style("opacity", 1)
    },
    updateCircle: function (id, newValue) {
        d3.select("#circle" + id).transition().duration(rampTime*1000).attr("r", visuals.getRadius(newValue)).ease("linear");
    }
};

const sounds = {
    initSine: function(id, initial, step) {
        __().sine({frequency: initial, id: "sine" + id}).frequency(initial).gain({id: "sinegain" + id, gain: gain}).dac();
    },
    playSine: function(id) {
        __("#sine" + id).play();
    },
    kill: function(id, deathTime) {
        var finalFrequency = utils.getRandom(beginningFrequency*3, beginningFrequency*9);
        __("#sine" + id).ramp(finalFrequency,deathTime,"frequency");
        __("#sinegain" + id).ramp(0,deathTime,"gain");

        window.setTimeout(() => {

            __("#sine" + id).stop();
        }, deathTime*2010);
    },
    update: function(id, newValue) {
        __("#sine" + id).ramp(newValue,rampTime,"frequency");
    }
};

const control = {
    init: function() {
        if (initted){
            return;
        }
        initted = true;

        const initialiseObjects = function(id, initial, step) {
            sounds.initSine(id, initial, step);
            visuals.initCircles({id: id, radius: visuals.getRadius(initial)});
            control.setupLoop(id, initial, step, (newValue) => {
                visuals.updateCircle(id, newValue);
                sounds.update(id, newValue);
            });
        };

        const generator = function(baseFreq, toGenerate) {
             [...Array(toGenerate).keys()]
                .map(id => initialiseObjects(id,
                    control.getInitialFreq(baseFreq, id, toGenerate),
                    control.getStepSize(-5, 5, id, toGenerate)));
             [...Array(toGenerate).keys()].map(id => sounds.playSine(id));
        };

        generator(beginningFrequency, toGenerate);
    },
    getStepSize: function(min, max, index, total) {
        return (max - min)*index/(total - 1) + min;
    },
    getNextFrequency: function(id, currentFreq, step) {
        const upOrDown = Math.random() < 0.333 ? -1 : 1;
        return currentFreq + (upOrDown * step)*utils.getRandom(0.9, 1.1);
    },
    ifKillLoop: function(id) {
        const result =  Math.random() < killLiklihood;
        if (result) {
            killLiklihood += killLiklihoodStep;
        }

        return result;
    },
    killLoop: function(id) {
        const deathTime = Math.round(utils.getRandom(deathTimeRange[0], deathTimeRange[1]));

        visuals.kill(id, deathTime);
        sounds.kill(id, deathTime);

    },
    setupLoop: function(id, initial, step, applyFunction) {
        var currentFreq = initial;

        const loop = function() {
            if (control.ifKillLoop(id)) {
                return control.killLoop(id);
            }
            currentFreq = control.getNextFrequency(id, currentFreq, step);
            applyFunction(currentFreq);
            setTimeout(loop, stepTime);
        };

        const rampAmount = rampTime*1000 / toGenerate;

        setTimeout(loop, rampAmount * (id + 1));
    },
    getInitialFreq: function(bass, index, total) {
        const range = [1, 1.4, 2.1, 2.3, 2.7];
        const upperLimit = Math.ceil(total / range.length);

        const rangeIndex = Math.floor(index / upperLimit);

        return bass*range[rangeIndex];
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
