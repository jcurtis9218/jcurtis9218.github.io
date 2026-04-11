import { default as seagulls } from '../../gulls.js'
import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = (window.innerWidth * window.innerHeight),
      chemical_a   = new Float32Array( size ),
      chemical_b   = new Float32Array( size )

const pane = new Pane();

function initialize_chemical_a(destination_buffer, buffer_size=size) {
  for (let i = 0; i < buffer_size; i++) {
    destination_buffer[i] = 1.;
  }
}


function distance(point_1, point_2) {
  return Math.sqrt(Math.pow(point_2[0]-point_1[0], 2) + Math.pow(point_2[1]-point_1[1], 2));
}

function initialize_chemical_b(destination_buffer, blob_radius, buffer_size=size) {
  let blob_center = [Math.random()*window.innerWidth, Math.random()*window.innerHeight];
  for (let i = 0; i < buffer_size; i++) {
    let pixel_coordinates = [i%window.innerWidth, Math.floor(i/window.innerWidth)]
    if (distance(pixel_coordinates, blob_center) <= blob_radius) {
      destination_buffer[i] = 1.
    }
    else {
      destination_buffer[i] = 0.
    }
  }
}

initialize_chemical_a(chemical_a);
initialize_chemical_b(chemical_b, 20);

const chemical_a_buffer1 = sg.buffer(chemical_a)
const chemical_a_buffer2 = sg.buffer(chemical_a)
const chemical_b_buffer1 = sg.buffer(chemical_b)
const chemical_b_buffer2 = sg.buffer(chemical_b)

const res = sg.uniform([ window.innerWidth, window.innerHeight ])

const feed_rate = sg.uniform(0.055);
const kill_rate = sg.uniform(0.062);
const diffusion_rate_a = sg.uniform(1.0);
const diffusion_rate_b = sg.uniform(0.5);
const paused = sg.uniform(0.0);

const diffusion_bias = {offset: {x: 0., y:0.}}
const difference_mode = sg.uniform(0.0);

pane.addBinding(feed_rate, 'value', {min:0.0, max:0.1, step:0.001, label:"Feed Rate"});
pane.addBinding(kill_rate, 'value', {min:0.0, max:0.1, step:0.001, label:"Kill Rate"});
pane.addBinding(diffusion_rate_a, 'value', {min:0.0, max:2.0, label:"Diffusion Rate A"});
pane.addBinding(diffusion_rate_b, 'value', {min:0.0, max:2.0, label:"Diffusion Rate B"});
pane.addBinding(diffusion_bias, 'offset', {x: {min:-0.5, max:0.5, step:0.01}, y: {min:-0.5, max:0.5, step:0.01, inverted:true}, label:"Diffusion Bias"});
pane.addBinding(paused, 'value', {options: {true:1.0, false:0.0}, label:"Paused"});
pane.addBinding(difference_mode, 'value', {options: {Colored:0.0, Difference:1.0}, label:"Color Mode"})

const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( chemical_a_buffer1, chemical_a_buffer2 ),
    sg.pingpong( chemical_b_buffer1, chemical_b_buffer2 ),
    // sg.pingpong(chemical_a_buffer2, chemical_a_buffer1),
    // sg.pingpong(chemical_b_buffer2, chemical_b_buffer1),
    difference_mode,
  ]
})

var diffusion_bias_x = sg.uniform(diffusion_bias.offset.x);
var diffusion_bias_y = sg.uniform(diffusion_bias.offset.y);

const computePass = sg.compute({
  shader: compute,
  data: [
    res,
    sg.pingpong( chemical_a_buffer1, chemical_a_buffer2 ),
    sg.pingpong( chemical_b_buffer1, chemical_b_buffer2 ),
    feed_rate,
    kill_rate,
    diffusion_rate_a,
    diffusion_rate_b,
    diffusion_bias_x,
    diffusion_bias_y,
    paused,
  ],
  onframe() {diffusion_bias_x.value = diffusion_bias.offset.x; diffusion_bias_y.value = diffusion_bias.offset.y},
  dispatchCount:  [Math.round(seagulls.width / 8), Math.round(seagulls.height/8), 1],
  times:16,
})

sg.run( computePass, renderPass )
