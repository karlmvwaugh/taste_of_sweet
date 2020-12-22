
var initted = false;
var container = null;
var effectiveWidth;
var paddingWidth;
var effectiveHeight;
var socket;

var state = {
    tremelo: { frequency: 4},
    pitch: {frequency: 0.15},
    pitch2: {gain: 5},
    delay: {delay: 0.5},
    squareWave: {frequency: 150},
    squareOsc: {gain: 10, frequency: 0.1},
    tremelo2: {frequency: 0.5, gain: 0.3},
    users: {count: 0}
};

var stateVisuals = {};

var clickList = [];

var initSocket = function() {

    socket = io();

    socket.on('dial move', (msg) => {
        reciever(msg.valueName, msg.property, msg.value);
    });

    socket.on('whole state', (receivedState) => {
        console.log(receivedState);
        for (var key in receivedState) {
            if (receivedState.hasOwnProperty(key)) {
                state[key] = receivedState[key];


                for (var subkey in state[key]) {
                    if (state[key].hasOwnProperty(subkey)) {
                        reciever(key, subkey, state[key][subkey]);
                    }
                }
            }
        }
    });
};

var clicker = function(event) {
    var x = event.clientX;
    var y = event.clientY;
    clickList.map(clickMethod => clickMethod(x, y));
};

const reciever = function(valueName, property, value) {
    console.log(valueName + "set to" + value);
    const attrObject = {};
    attrObject[property] = value;
    __("#" + valueName).attr(attrObject);

    stateVisuals[valueName][property](value);

    state[valueName][property] = value;
};

const dispatcher = function(valueName, property, value) {
    reciever(valueName, property, value);
    socket.emit('dial move', {valueName: valueName, property: property, value: value});
};

const initD3 = function() {
        var width = document.body.clientWidth;
        effectiveWidth = width * 0.9;
        paddingWidth = width*0.05;
        var height = document.body.clientHeight;
        console.log("!" + document.body.clientHeight);
        if (height < 1000) {
            height = 1000;
        }

        effectiveHeight = height;
        console.log(width + ":" + height);
        var centre = {x: width/2, y: height/2};

        var svg = d3.select("#screen").append("svg").attr("width",width).attr("height", height);
        var screen = d3.select("#screen");
        screen.style("background", "#010203");

        var container = svg.append("g");

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
    __().lfo({id: "tremelo2", frequency:0.5 ,modulates:"gain",gain:0.3, type:"sine"}).connect("#gain");


};

const buildSlideControl = function(valueName, property, minimumValue, maximumValue, width, startWidth, height, startHeight) {
    var getCoord = function(value) {
        const share = (value - minimumValue) / (maximumValue - minimumValue);

        return share*width + startWidth;
    };

    var currentValue = state[valueName][property];

    var ellipseIsGreen = true;

    var getDuration = function() {
        var share = (currentValue - minimumValue) / (maximumValue - minimumValue);
        return (1 - share) * 4900 + 100;
    };

    var ellipse = container.append("ellipse")
        .attr("cx", startWidth + width/2)
        .attr("cy", startHeight + height/2)
        .attr("rx", width/2)
        .attr("ry", height/2)
        .attr("fill", "black")
        .style("opacity", 1); //0.5 if we want them to overlap

    var circle = container
        .append("circle")
        .attr("id", valueName)
        .attr("r", 10)
        .attr("fill", "black")
        .attr("stroke", "none")
        .attr("stroke-width", "0px")
        .attr("cx", getCoord(currentValue))
        .attr("cy", startHeight + (height/2))
        .style("opacity", 1);

    var colourLoop = function() {
        var duration = getDuration();
        ellipse.transition().duration(duration)
            .attr("fill", ellipseIsGreen ? "purple" : "green");

        circle.transition().duration(duration)
            .attr("fill", ellipseIsGreen ? "orange" : "red");


        ellipseIsGreen = !ellipseIsGreen;

        window.setTimeout(colourLoop, duration);
    };

    colourLoop();

    const coordsInRange = function (x, y) {
        return (x > startWidth && x < startWidth + width && y > startHeight && y < startHeight + height);
    };

    const clickFunction = function(x, y) {
      if (coordsInRange(x, y)) {
          var xShare = (x - startWidth) / (width);

          var newValue = xShare * (maximumValue - minimumValue) + minimumValue;
          dispatcher(valueName, property, newValue);
      }
    };

    clickList.push(clickFunction);

    const updateFunction = function (updateValue) {
        console.log(updateValue + ":" + getCoord(updateValue));
        currentValue = updateValue;
        circle.transition().duration(100).attr("cx", getCoord(updateValue));
    };
    setStateVisuals(valueName, property, updateFunction);
};

var countDisplay = function() {
    var text = container.append("text")
        .text(state.users.count)
        .attr("x", effectiveWidth - paddingWidth)
        .attr("y", effectiveHeight - paddingWidth)
        .attr("fill", "white");

    const updateFunction = function (updateValue) {
        currentValue = updateValue;
        text.transition().duration(100).text(state.users.count);
    };

    setStateVisuals("users", "count", updateFunction);
};

var setStateVisuals = function(valueName, property, callback) {
    if (!stateVisuals[valueName]) {
        stateVisuals[valueName] = {}
    }

    stateVisuals[valueName][property] = callback;
};

container = initD3();

const init = function(event) {
    if (initted) {
        clicker(event);
        return;
    }
    initted = true;

    initSounds();

    buildSlideControl("tremelo", "frequency",1, 10, effectiveWidth, paddingWidth, 30, 30);
    buildSlideControl("pitch", "frequency", 0.05, 2, effectiveWidth, paddingWidth, 30, 60);
    buildSlideControl("pitch2", "gain",5, 100, effectiveWidth, paddingWidth, 30, 90);
    buildSlideControl("delay", "delay",0.05, 2, effectiveWidth, paddingWidth, 30, 120);

    buildSlideControl("squareWave", "frequency",20, 200, effectiveWidth, paddingWidth, 30, 180);
    buildSlideControl("squareOsc", "gain",1, 100, effectiveWidth, paddingWidth, 30, 210);
    buildSlideControl("squareOsc", "frequency",0, 1, effectiveWidth, paddingWidth, 30, 240);
    buildSlideControl("tremelo2", "frequency",0.1, 2, effectiveWidth, paddingWidth, 30, 270);
    buildSlideControl("tremelo2", "gain",0, 0.7, effectiveWidth, paddingWidth, 30, 300);
    countDisplay();
    __("#sine").play();
    __("#squareWave").play();

    window.setTimeout(initSocket, 100);
    // initSocket();

    //*
    // CHANGES:
    // kaos pad section
    // mini-chat window,
    // online counter (working ish)
    // more controls on current things (osc speed, depth, second delay time etc.)
    // weclome page
    // display controls as two sides /
    // Names on the controls
    // Different colourings on different control sections (perhaps?)
    // relative volume controls. 
    //
    //
    // *//


};
