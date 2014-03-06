$(document).ready(function() {
  // Buffer sounds
  for (var i=0; i<sources.length; i++) {
    loadSound(sources[i]);
  }

  // Initialize Synth Pad
  var synthPad = new SynthPad();
})


// ************ DrumKit Buttons ************ //
// Name source for both the files and the DOM elements
var sources = ["clap", "clap_lo", "cymbal", "hi_hat", "horn", "horn_lo", "kick", "kick_lo", "snare","synth_long","synth_short", "bass_hit", "Loop_HouseFunky", "Loop_LegGoPiano", "Loop_SpacedOut"]

// Creates an audio context object in the variable 'context'
// Use XMLHttpRequest for fetching sound files
var context;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext(); // <-- WHERE THE MAGIC HAPPENS
var source_url_obj = {}; // Holds Audio Buffers

// Load sound from source, store audio buffer in source url object (done on page load)
function loadSound(url) {
  // Request audio file
  url += ".wav"
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  // Audio data is in binary, therefore response type must be set to 'array buffer' -- more detail below in Note (1)
  request.responseType = 'arraybuffer';

  // Decode asynchronously, store audio in buffer
  request.onload = function() { // <-- ** LOOKUP .onload method
    // Asychronously decode the audio buffer with the .decodeAudioData method
    context.decodeAudioData(request.response, function(buffer) {
      // when complete, calls the callback with the decoded PCM (see Note 2) data as an AudioBuffer
      source_url_obj[url] = buffer;
    })
  };
  request.send();
}

// *** DRUM HITS ***
// Add event handlers (For Self Play)
// $.each(sources, function(i, source) {
//   $("#"+source).on('click', function() {
//     playBeat(source_url_obj[source+".wav"]);
//   })
// })

// // Add event handlers (For Drum Kit Social)
$.each(sources, function(i, source) {
  $("#"+source).on('click', function() {
    socket.emit("drum_hit", {"source": source+".wav"});
  })
})

// Social Drum Kit Functionality
// Event recieved, play sound on YOUR machine
var socket = io.connect()
socket.on("drum_played", function (data) {
  // alert("Somebody rockin' dem beats!");
  var source = data['source_serv']['source'];
  playBeat(source_url_obj[source]);
});

// Click a button, play sound on OTHER folks' client
$('button').on('mousedown', function() {
  socket.emit("drum_hit", {"source": $(this.val())});
})


// Plays the drum hits
function playBeat(buffer) {
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
}

// *** LOOPS ***
// Loop Object
var audio = { _isPlaying: false}

// Adds event handlers for loops (Play)
$("#play").on('click', function() {
  var selection = ($("#loops").val().replace(/\s+/g, ''));
  var playBuffer = source_url_obj["Loop_"+selection+".wav"]
  playLoop(selection, playBuffer)
})

// Adds event handlers for loops (Stop)
$("#stop").on('click', function() {
var selection = ($("#loops").val().replace(/\s+/g, ''));
  stopLoop(selection);
})

// Plays the loops
function playLoop(key, buffer) {
  if (!audio._isPlaying) {
    audio[key] = context.createBufferSource();
    audio[key]["buffer"] = buffer;
    audio[key].loop = true;
    audio[key].connect(context.destination);
    audio[key].start(0);
    audio._isPlaying = true;
  }
}

// Stops the loops
function stopLoop(key) {
  audio[key].stop(0);
  audio._isPlaying = false;
}

// ************** Syntesizer ************** //
var SynthPad = (function() {
  // Variables
  var myCanvas;
  var frequencyLabel;
  var volumeLabel;

  var myAudioContext;
  var oscillator;
  var gainNode;

  // Notes
  var lowNote = 261.63; // C4
  var highNote = 493.88; // B4

  // Constructor
  var SynthPad = function() {
    myCanvas = document.getElementById('synth-pad');
    frequencyLabel = document.getElementById('frequency');
    volumeLabel = document.getElementById('volume');

    // Create an audio context.
    myAudioContext = new webkitAudioContext();

    SynthPad.setupEventListeners();
  };


  // Event Listeners
  SynthPad.setupEventListeners = function() {

    // Disables scrolling on touch devices.
    document.body.addEventListener('touchmove', function(event) {
      event.preventDefault();
    }, false);

    myCanvas.addEventListener('mousedown', SynthPad.playSound);
    myCanvas.addEventListener('touchstart', SynthPad.playSound);

    myCanvas.addEventListener('mouseup', SynthPad.stopSound);
    document.addEventListener('mouseleave', SynthPad.stopSound);
    myCanvas.addEventListener('touchend', SynthPad.stopSound);
  };


  // Play a note.
  SynthPad.playSound = function(event) {
    oscillator = myAudioContext.createOscillator();
    gainNode = myAudioContext.createGainNode();

    oscillator.type = 'triangle';

    gainNode.connect(myAudioContext.destination);
    oscillator.connect(gainNode);

    SynthPad.updateFrequency(event);

    oscillator.start(0);

    myCanvas.addEventListener('mousemove', SynthPad.updateFrequency);
    myCanvas.addEventListener('touchmove', SynthPad.updateFrequency);

    myCanvas.addEventListener('mouseout', SynthPad.stopSound);
  };


  // Stop the audio.
  SynthPad.stopSound = function(event) {
    if (typeof oscillator !== "undefined") {
      oscillator.stop(0);
      myCanvas.removeEventListener('mousemove', SynthPad.updateFrequency);
      myCanvas.removeEventListener('touchmove', SynthPad.updateFrequency);
      myCanvas.removeEventListener('mouseout', SynthPad.stopSound);
    }
  };


  // Calculate the note frequency.
  SynthPad.calculateNote = function(posX) {
    var noteDifference = highNote - lowNote;
    var noteOffset = (noteDifference / myCanvas.offsetWidth) * (posX - myCanvas.offsetLeft);
    return lowNote + noteOffset;
  };


  // Calculate the volume.
  SynthPad.calculateVolume = function(posY) {
    var volumeLevel = 1 - (((100 / myCanvas.offsetHeight) * (posY - myCanvas.offsetTop)) / 100);
    return volumeLevel;
  };


  // Fetch the new frequency and volume.
  SynthPad.calculateFrequency = function(x, y) {
    var noteValue = SynthPad.calculateNote(x);
    var volumeValue = SynthPad.calculateVolume(y);

    oscillator.frequency.value = noteValue;
    gainNode.gain.value = volumeValue;

    frequencyLabel.innerHTML = Math.floor(noteValue) + ' Hz';
    volumeLabel.innerHTML = Math.floor(volumeValue * 100) + '%';
  };


  // Update the note frequency.
  SynthPad.updateFrequency = function(event) {
    if (event.type == 'mousedown' || event.type == 'mousemove') {
      SynthPad.calculateFrequency(event.x, event.y);
    } else if (event.type == 'touchstart' || event.type == 'touchmove') {
      var touch = event.touches[0];
      SynthPad.calculateFrequency(touch.pageX, touch.pageY);
    }
  };


  // Export SynthPad.
  return SynthPad;
})();

// ************** REFACTORED ************** //

// $("#bass_hit").on('click', function() {
//   playSound(source_url_obj["bass_hit.wav"]);
// })

// $("#kick_lo").on('click', function() {
//   playSound(source_url_obj["kick_lo.wav"]);
// })

// $("#kick").on('click', function() {
//   playSound(source_url_obj["kick.wav"]);
// })

// $("#snare").on('click', function() {
//   playSound(source_url_obj["snare.wav"]);
// })

// $("#clap").on('click', function() {
//   playSound(source_url_obj["clap.wav"]);
// })

// $("#clap_lo").on('click', function() {
//   playSound(source_url_obj["clap_lo.wav"]);
// })

// $("#cymbal").on('click', function() {
//   playSound(source_url_obj["cymbal.wav"]);
// })

// $("#hi_hat").on('click', function() {
//   playSound(source_url_obj["hi_hat.wav"]);
// })

// $("#horn").on('click', function() {
//   playSound(source_url_obj["horn.wav"]);
// })

// $("#horn_lo").on('click', function() {
//   playSound(source_url_obj["horn_lo.wav"]);
// })

// $("#synth_long").on('click', function() {
//   playSound(source_url_obj["synth_long.wav"]);
// })

// $("#synth_short").on('click', function() {
//   playSound(source_url_obj["synth_short.wav"]);
// })




// FOOTNOTES

// !!!!!!!!!!!! WHY DIDN'T THIS WORK !!!!!!!!!!!!! ASYNC!?!?
// for (i=0; i<sources.length; i++) {
//   var selector = "#"+sources[i]
//   var source_key = sources[i]+".wav"
//   console.log(selector)
//   console.log(source_key)
//   $(selector.toString()).on('click', function() {
//     playSound(source_url_obj[source_key.toString()]);
//   })
// }

/*

(1) The ArrayBuffer is a data type that is used to represent a generic, fixed-length binary data buffer. You can't directly manipulate the contents of an ArrayBuffer; instead, you create an ArrayBufferView object which represents the buffer in a specific format, and use that to read and write the contents of the buffer.
-- https://developer.mozilla.org/en-US/docs/Web/API/ArrayBuffer
-- http://www.html5rocks.com/en/tutorials/file/xhr2/

(2) Pulse-code modulation (PCM) is a method used to digitally represent sampled analog signals. It is the standard form of digital audio in computers, Compact Discs, digital telephony and other digital audio applications. In a PCM stream, the amplitude of the analog signal is sampled regularly at uniform intervals, and each sample is quantized to the nearest value within a range of digital steps.

PCM streams have two basic properties that determine their fidelity to the original analog signal: the sampling rate, which is the number of times per second that samples are taken; and the bit depth, which determines the number of possible digital values that each sample can take.

*/