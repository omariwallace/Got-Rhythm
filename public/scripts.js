$(document).ready(function() {
  // Buffer sounds
  for (var i=0; i<sources.length; i++) {
    loadSound(sources[i]);
  }

  // Switch toggle
  window.solo = true;
  $('.Switch').click(function() {
    $(this).toggleClass('On').toggleClass('Off');
    window.solo = !window.solo;
    console.log("switch: ", $(this).val())
  });
});


// ************ DrumKit Buttons ************ //
// Name source for both the files and the DOM elements
var sources = ["clap", "clap_lo", "cymbal", "hi_hat", "horn", "horn_lo", "kick", "kick_lo", "snare","synth_long","synth_short", "bass_hit", "Loop_HouseFunky", "Loop_LegGoPiano", "Loop_SpacedOut"];

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

      sourceJs = context.createJavaScriptNode(2048);
      analyzer = context.createAnalyser();
      // Defaults from page -- review specs on MDN;
      analyzer.smoothingTimeConstant = 0.6;
      analyzer.fftSize = 512;

      source_url_obj[url] = buffer;
    });
  };
  request.send();
}

// *** DRUM HITS ***
// Add event handlers (For Self Play)
if(window.solo) {
  $.each(sources, function(i, source) {
    $("#"+source).on('click', function() {
      playBeat(source_url_obj[source+".wav"]);
    })
  })
} else {
  // Add event handlers (For Drum Kit Social)
  $.each(sources, function(i, source) {
    $("#"+source).on('click', function() {
      socket.emit("drum_hit", {"source": source+".wav"});
    });
  });
  // Social Drum Kit Functionality
  // Event recieved, play sound on YOUR machine
  var socket = io.connect();
  socket.on("drum_played", function (data) {
    // alert("Somebody rockin' dem beats!");
    var source = data['source_serv']['source'];
    playBeat(source_url_obj[source]);
  });

  // Click a button, play sound on OTHER folks' client
  $('button').on('mousedown', function() {
    socket.emit("drum_hit", {"source": $(this.val())});
  });
}




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
var audio = { _isPlaying: false};

// Adds event handlers for loops (Play)
$("#play").on('click', function() {
  var selection = ($("#loops").val().replace(/\s+/g, ''));
  var playBuffer = source_url_obj["Loop_"+selection+".wav"];
  playLoop(selection, playBuffer);
});

// Adds event handlers for loops (Stop)
$("#stop").on('click', function() {
var selection = ($("#loops").val().replace(/\s+/g, ''));
  stopLoop(selection);
});

// Plays the loops
function playLoop(key, buffer) {
  if (!audio._isPlaying) {
    sourceJs["buffer"] = buffer;
    sourceJs.connect(context.destination);

    audio[key] = context.createBufferSource();
    audio[key].loop = true;
    audio[key]["buffer"] = buffer;

    // Connecting script processor node (sourceJs),
    audio[key].connect(analyzer);
    analyzer.connect(sourceJs);
    audio[key].connect(context.destination);

    sourceJs.onaudioprocess = function(e) {
      array = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(array);
      window.boost = 0;
      for (var i=0; i<array.length; i++) {
        window.boost += array[i]
      }
      window.boost = window.boost/array.length;
    };

    audio[key].start(0);
    audio._isPlaying = true;
  }
}

// Stops the loops
function stopLoop(key) {
  audio[key].stop(0);
  audio._isPlaying = false;
}


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