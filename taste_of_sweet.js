var initted = false;
var kill = false;
var rampTime = 4;
var deathTimeRange = [2, 16];
var gain = 0.03;
var stepTime = rampTime * 1010;
var killLiklihood = 0.05;
var container = null;
var beginningFrequency = 100;
var toGenerate = 66; //should be even?


var getRandom = function(min, max) {
    return Math.random() * (max - min + 1) + min;
};

var getNextFrequency = function(id, currentFreq, step) {
    var upOrDown = Math.random() < 0.333 ? -1 : 1;
    return currentFreq + (upOrDown * step)*getRandom(0.9, 1.1);
};



var sineMachine = function(id, initial, step) {
    return __().sine({frequency: initial, id: "sine" + id}).gain({id: "sinegain" + id, gain: gain}).dac().play();
};

var ifKillLoop = function(id) {
  return Math.random() < killLiklihood;
};

var killLoop = function(id) {

    var deathTime = Math.round(getRandom(deathTimeRange[0], deathTimeRange[1]));
    var finalFrequency = getRandom(beginningFrequency*2, beginningFrequency*6);

    __("#sine" + id).ramp(finalFrequency,deathTime,"frequency");
    __("#sinegain" + id).ramp(0,deathTime,"gain");


    d3.select("#circle" + id).transition().duration(deathTime*1000)
        .attr("r", getRadius(300))
        .attr("stroke-width", getRandom(100, 600) + "px")
        .attr("stroke", "#fe0102")
        .attr("cx", getRandom(-2000, 2000))

        .attr("cy", getRandom(-2000, 2000))
        .style("opacity", 0)
        .style()
        .ease("linear")
        .remove();

    window.setTimeout(() => {

        __("#sine" + id).stop();
    }, deathTime*2010);
};

var setupLoop = function(id, initial, step, applyFunction) {
    var currentFreq = initial;

    var loop = function() {
        if (ifKillLoop(id)) {
            return killLoop(id);
        }
        currentFreq = getNextFrequency(id, currentFreq, step);
        applyFunction(currentFreq);
        setTimeout(loop, stepTime);
    };

    var rampAmount = rampTime*1000 / toGenerate;

    setTimeout(loop, rampAmount * (id + 1));
};

var setUpCircles = function(d) {
    container.append("circle")
        .attr("id", "circle" + d.id)
        .attr("r", d.radius)
        .attr("fill", "none")
        .attr("stroke", "#ccbbaa")
        .attr("stroke-width", "1px")
        .attr("cx", 0)
        .attr("cy", 0)
        .style("opacity", 1)
};

var setUpD3 = function() {
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
//        .attr("transform", "translate(" + centre.x + ","  + centre.y + ")");

    return container;
};


var getInitialFreq = function(bass, index, total) {
    var range = [1, 1.4, 2.1, 2.3, 2.7];
    var upperLimit = Math.ceil(total / range.length);

    var rangeIndex = Math.floor(index / upperLimit);

    return bass*range[rangeIndex];
};

var getStepSize = function(min, max, index, total) {
    return (max - min)*index/(total - 1) + min;
};

var getRadius = function(initial) {
    var minFreq = 50;
    var maxFreq = 1000;

    var percentageThrough = (initial - minFreq)/(maxFreq - minFreq);

    var minSize = 10;
    var maxSize = 3000;

    return percentageThrough*(maxSize - minSize) + minSize;
};

var init = function() {
    if (initted){
        return;
    }
    initted = true;

    var initialiseObjects = function(id, initial, step) {
        sineMachine(id, initial, step);
        setUpCircles({id: id, radius: getRadius(initial)});
        setupLoop(id, initial, step, (newValue) => {
            console.log("Sin: " + id + " initial: " + initial + "/ Freq: " + newValue);
            __("#sine" + id).ramp(newValue,rampTime,"frequency");

            d3.select("#circle" + id).transition().duration(rampTime*1000).attr("r", getRadius(newValue)).ease("linear");
        });
    };

    var generator = function(baseFreq, toGenerate) {
        return [...Array(toGenerate).keys()]
            .map(id => initialiseObjects(id,
                getInitialFreq(baseFreq, id, toGenerate),
                getStepSize(-5, 5, id, toGenerate)));
    };


    generator(beginningFrequency, toGenerate);
};


container = setUpD3();
