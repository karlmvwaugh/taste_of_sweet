
var initted = false;
var container = null;
var effectiveWidth;
var paddingWidth;
var effectiveHeight;

var state = {
    tremelo: 4,
    pitch: 0.15,
    pitch2: 5,
    delay: 0.5,
    squareWave: 150,
    squareOsc: 10
};

var stateAudio = {
    tremelo: "frequency",
    pitch: "frequency",
    pitch2: "gain",
    delay: "delay",
    squareWave: "frequency",
    squareOsc: "gain"
};

var stateVisuals = {};

var clickList = [];

var clicker = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    clickList.map(clickMethod => clickMethod(x, y));
};

const dispatcher = function(valueName, value) {
    console.log(valueName + "set to" + value);
    const attrObject = {};
    attrObject[stateAudio[valueName]] = value;
    __("#" + valueName).attr(attrObject);

    stateVisuals[valueName](value);

    state[valueName] = value;
};

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

const initD3 = function() {
        var width = document.body.clientWidth;
        effectiveWidth = width * 0.9;
        paddingWidth = width*0.05;
        var height = document.body.clientHeight;

        if (height < 1000) {
            height = 1000;
        }

        effectiveHeight = height;
        console.log(width + ":" + height);
        var centre = {x: width/2, y: height/2};

        var svg = d3.select("#screen").append("svg").attr("width",width).attr("height", height);
        var screen = d3.select("#screen");
        screen.style("background", "#010203");

        var container = svg.append("g")
            //.attr("transform", "translate(" + centre.x + ","  + 0 + ")");
            //.attr("transform", "translate(" + centre.x + ","  + centre.y + ")");

        return container;
    };

const initSounds = function() {
    __().sine({id: "sine", frequency: 150})
        .gain({id: "gain", gain: 1})
        .delay({delay: 0.5, feedback: 0.3, cutoff: 1500, id: "delay"})
        .gain({id: "MG1", gain: 0.6})

        .dac();


    __().lfo({id: "tremelo", frequency:4 ,modulates:"gain",gain:1,type:"square"}).connect("#gain");
    __().lfo({id: "pitch", frequency:0.15 ,modulates:"frequency",gain:100,type:"sine"}).connect("#sine");

    __().lfo({id: "pitch2", frequency:0.1 ,modulates:"gain",gain:5,type:"sine"}).connect("#pitch");

    __().square({id: "squareWave", frequency:150,gain:1})
        .gain({id: "gain2", gain: 1})
        .delay({delay: 2, feedback: 0.5, cutoff: 1500, id: "delay2"})
        .gain({id: "MG2", gain: 0.3})

        .dac();

     __().lfo({id: "squareOsc", frequency:0.1 ,modulates:"frequency",gain:10,type:"sine"}).connect("#squareWave");


};

const buildSlideControl = function(methodName, minimumValue, maximumValue, width, startWidth, height, startHeight) {
    var getCoord = function(value) {
        const share = (value - minimumValue) / (maximumValue - minimumValue);

        return share*width + startWidth;
    };

    container.append("ellipse")
        .attr("cx", startWidth + width/2)
        .attr("cy", startHeight + height/2)
        .attr("rx", width/2)
        .attr("ry", height/2)
        .attr("fill", "green")
        .style("opacity", 0.5);

    var circle = container
        .append("circle")
        .attr("id", methodName)
        .attr("r", 10)
        .attr("fill", "red")
        .attr("stroke", "none")
        .attr("stroke-width", "0px")
        .attr("cx", getCoord(state[methodName]))
        .attr("cy", startHeight + (height/2))
        .style("opacity", 1);

    const coordsInRange = function (x, y) {
        return (x > startWidth && x < startWidth + width && y > startHeight && y < startHeight + height);
    };

    const clickFunction = function(x, y) {
      if (coordsInRange(x, y)) {
          console.log(x + ":" + y);
          console.log(width + ":" + startWidth);
          console.log(height + "-" + startHeight);

          var xShare = (x - startWidth) / (width);


          var newValue = xShare * (maximumValue - minimumValue) + minimumValue;
          dispatcher(methodName, newValue);
      }
    };

    clickList.push(clickFunction);

    const updateFunction = function (updateValue) {
        console.log(updateValue + ":" + getCoord(updateValue));

        circle.transition().duration(100).attr("cx", getCoord(updateValue));
    };

    stateVisuals[methodName] = updateFunction;
};


container = initD3();

const init = function(event) {
    if (initted) {
        clicker(event);
        return;
    }
    initted = true;

    initSounds();
    buildSlideControl("tremelo", 1, 10, effectiveWidth, paddingWidth, 50, 50);
    buildSlideControl("pitch", 0.05, 2, effectiveWidth, paddingWidth, 50, 100);
    buildSlideControl("pitch2", 5, 100, effectiveWidth, paddingWidth, 50, 150);
    buildSlideControl("delay", 0.05, 2, effectiveWidth, paddingWidth, 50, 200);

    buildSlideControl("squareWave", 20, 200, effectiveWidth, paddingWidth, 50, 300);
    buildSlideControl("squareOsc", 1, 100, effectiveWidth, paddingWidth, 50, 350);


    __("#sine").play();
    __("#squareWave").play();
};
