var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, $("#visualization").width() / $("#visualization").height(), 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize( $("#visualization").width(), $("#visualization").height());
// $("#visualization").append(renderer.domElement);
document.getElementById("visualization").appendChild(renderer.domElement)

var geometry = new THREE.CubeGeometry(1,1,1);
  var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  var render = function () {
    requestAnimationFrame(render);

    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;

    renderer.render(scene, camera);
  };

render();

// var cubes = new Array();
// var i = 0;
// for(var x = 0; x < 30; x += 2) {
//   var j = 0;
//   cubes[i] = new Array();
//   for(var y = 0; y < 30; y += 2) {
//     var geometry = new THREE.CubeGeometry(1, 1, 1);

//     var material = new THREE.MeshPhongMaterial({
//       color: randomFairColor(),
//       ambient: 0x808080,
//       specular: 0xffffff,
//       shininess: 20,
//       reflectivity: 5.5
//     });

//     cubes[i][j] = new THREE.Mesh(geometry, material);
//     cubes[i][j].position = new THREE.Vector3(x, y, 0);

//     scene.add(cubes[i][j]);
//     j++;
//   }
//   i++;
// }

// // Ensures that the camera is not inside of the cubes visual
// camera.position.z = 50;

// // Renders the scene
// var render = function () {

//   if(typeof array === 'object' && array.length > 0) {
//     var k = 0;
//     for(var i = 0; i < cubes.length; i++) {
//       for(var j = 0; j < cubes[i].length; j++) {
//         var scale = (array[k] + boost) / 30;
//         cubes[i][j].scale.z = (scale < 1 ? 1 : scale);
//         k += (k < array.length ? 1 : 0);
//       }
//     }
//   }

//   // ...requestAnimationFrame has a number of advantages...(e.g.) it pauses when the user navigates to another browser tab, hence not wasting their precious processing power and battery life.
//   requestAnimationFrame(render);
//   renderer.render(scene, camera);
// };

// render();

// // ******************************* //

// // Helper function for colors of cubes
// function randomFairColor() {
//   var min = 64;
//   var max = 224;
//   var r = (Math.floor(Math.random() * (max - min + 1)) + min) * 65536;
//   var g = (Math.floor(Math.random() * (max - min + 1)) + min) * 256;
//   var b = (Math.floor(Math.random() * (max - min + 1)) + min);
//   return r + g + b;
// }