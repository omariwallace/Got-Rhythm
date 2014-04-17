$(document).ready(function() {
  // Buffer sounds
  for (var i=0; i<sources.length; i++) {
    loadSound(sources[i]);
  }

  // Switch toggle for solo or party play
  window.solo = true;
  $('.Switch').click(function() {
    $(this).toggleClass('On').toggleClass('Off');
    window.solo = !window.solo;
  });

});


// ************ DrumKit Buttons ************ //
// Name source for both the files and the DOM elements
var sources = ["clap", "clap_lo", "cymbal", "hi_hat", "horn", "horn_lo", "kick", "kick_lo", "snare","synth_long","synth_short", "bass_hit", "Loop_HouseFunky", "Loop_LegGoPiano", "Loop_SpacedOut"];

var socket = io.connect();
var context;
var source, sourceJs;
var analyzer;
var buffer;
window.boost = 0;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

// Creates an audio context object in the variable 'context'
// Use XMLHttpRequest for fetching sound files
context = new AudioContext(); // <-- WHERE THE MAGIC HAPPENS
var source_url_obj = {}; // Holds Audio Buffers

// Load sound from source, store audio buffer in source url object (done on page load)
function loadSound(url) {
  // Request audio file
  url += ".wav";
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  // Audio data is in binary, therefore response type must be set to 'array buffer' -- more detail below in Note (1)
  request.responseType = 'arraybuffer';

  // Decode asynchronously, store audio in buffer
  request.onload = function() { // <-- ** LOOKUP .onload method
    // Asychronously decode the audio buffer with the .decodeAudioData method
    context.decodeAudioData(request.response, function(buffer) {
      // when complete, calls the callback with the decoded PCM (see Note 2) data as an AudioBuffer

      // Adding Javascript Node and Analyzer to feed audio data to visulizaiton
      // SOURCE: http://srchea.com/experimenting-with-web-audio-api-three-js-webgl

      // Create a ScriptProcessorNode
      // https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode
      sourceJs = context.createJavaScriptNode(2048);

      // Create AnalyserNode -- provides real-time frequency and time-domain analysis information.
      // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
      analyzer = context.createAnalyser();
      // Defaults from page -- review specs on MDN;
      analyzer.smoothingTimeConstant = 0.6;
      analyzer.fftSize = 512;

      // Adds buffered sound to source sound object
      source_url_obj[url] = buffer;
    });
  };
  request.send();
}

// ********************************* //
// *** DRUM HITS *** //
// ********************************* //
// Adds click event handlers to drum kit buttons
$.each(sources, function(i, source) {
  $("#"+source).on('click', function() {
    if(window.solo) {
      // Play beat for solo play
      console.log("solo play beat");
      playBeat(source_url_obj[source+".wav"]);
    } else {
      // Emit drum hit for party play
      console.log("social play beat");
      socket.emit("drum_hit", {"source": source+".wav"});
    }
  });
});

// Socket reciever for when a social party player creates a drum hit
socket.on("drum_played", function (data) {
  // console.log("Somebody rockin' dem beats!");
  var source = data['source_serv']['source'];
    if(!window.solo) {
      // Only plays if the "Switch" is on "Party"
      // console.log("solo?: ", window.solo);
      playBeat(source_url_obj[source]);
      // console.log("just played from socket")
    }
});

// ********************************* //
// *** LOOPS *** //
// ********************************* //
// Loop Object
var audio = { _isPlaying: false};

// Adds event handlers for playing loop tracks
$("#play").on('click', function() {
  var selection = ($("#loops").val().replace(/\s+/g, ''));
  if (selection === "PickYourFlava'...") {
    // User did not pick from the dropdown
    alert("Select your track loop from the dropdown!")
  } else {
    var playBuffer = source_url_obj["Loop_"+selection+".wav"];
    if (!audio._isPlaying) {
      playLoop(selection, playBuffer);
    }
  }
});

// Adds event handlers for stopping loop tracks
$("#stop").on('click', function() {
var selection = ($("#loops").val().replace(/\s+/g, ''));
  if (audio._isPlaying) {
    stopLoop(selection);
  }
});

// ********************************* //
// Helper Functions //
// ********************************* //

// Plays the drum hits
function playBeat(buffer) {
  // creates a sound source
  var source = context.createBufferSource();
  source.buffer = buffer;
  // connect the source to the context's destination (the speakers)
  source.connect(context.destination);
  // play the source now
  // note: on older systems, may have to use deprecated noteOn(time);
  source.start(0);
}

// Plays the loops
function playLoop(key, buffer) {
  // Add buffered sound as a property to the Script Processor Node
  sourceJs["buffer"] = buffer;
  // Connect the Script Processor Node to the output
  sourceJs.connect(context.destination);

  // Audio[key] is a buffer source
  audio[key] = context.createBufferSource();
  // Add looping to the buffer source
  audio[key].loop = true;
  // Add buffered sound to buffer source
  audio[key]["buffer"] = buffer;

  // Connecting buffer source to analyzer
  audio[key].connect(analyzer);
  // Connecting analyzer to script processor node
  analyzer.connect(sourceJs);
  // Connecting buffer source to output
  audio[key].connect(context.destination);

  // onaudioprocess is Script Processor Node's event handler
  // Giving the event handler a function to process audio event (e)
  sourceJs.onaudioprocess = function(e) {
    // frequencyBinCount: unsigned long value containing half the FFT size.
    array = new Uint8Array(analyzer.frequencyBinCount); // Note 3

    // Copies the current frequency data from music being played into the array
    analyzer.getByteFrequencyData(array);
    // window.boost impacts the cube sizing animation
    window.boost = 0;
    for (var i=0; i<array.length; i++) {
      window.boost += array[i]
    }
    window.boost = window.boost/array.length;
  };

  // Plays the loop
  audio[key].start(0);
  audio._isPlaying = true;
}

// Stops the loops
function stopLoop(key) {
  // Stops the loop
  audio[key].stop(0);
  audio._isPlaying = false;
}


// ********************************* //
// FOOTNOTES //
// ********************************* //

/***

(1) The ArrayBuffer is a data type that is used to represent a generic, fixed-length binary data buffer. You can't directly manipulate the contents of an ArrayBuffer; instead, you create an ArrayBufferView object which represents the buffer in a specific format, and use that to read and write the contents of the buffer.
-- https://developer.mozilla.org/en-US/docs/Web/API/ArrayBuffer
-- http://www.html5rocks.com/en/tutorials/file/xhr2/

(2) Pulse-code modulation (PCM) is a method used to digitally represent sampled analog signals. It is the standard form of digital audio in computers, Compact Discs, digital telephony and other digital audio applications. In a PCM stream, the amplitude of the analog signal is sampled regularly at uniform intervals, and each sample is quantized to the nearest value within a range of digital steps.

PCM streams have two basic properties that determine their fidelity to the original analog signal: the sampling rate, which is the number of times per second that samples are taken; and the bit depth, which determines the number of possible digital values that each sample can take.

(3) U stands for UNSIGNED, intArray is a typed arry of type Integer
-- http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/

Unsigned means only positive; signed includes both positive and negative

Uint8Array is similar to an Array where each item is an 8 bit (1 byte) unsigned integer. Uint8Arrays cannot change size after creation.
-- http://www.javascripture.com/Uint8Array




***/