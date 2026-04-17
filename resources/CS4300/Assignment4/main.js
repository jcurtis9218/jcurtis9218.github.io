import { default as gulls } from './gulls.js'
import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import {default as Mouse} from './helpers/mouse.js';

const sg = await gulls.init(),
      render_shader  = await gulls.import( './render.wgsl' ),
      compute_shader = await gulls.import( './compute.wgsl' ),
      cache_shader  = await gulls.import( './calculate_cached.wgsl' )

Mouse.init()


const num_particles = 2048,
      NUM_PROPERTIES = 8,
      state = new Float32Array( num_particles * NUM_PROPERTIES )
//
// for( let i = 0; i < num_particles * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
//   state[ i ] = 0
//   state[ i + 1 ] = 0
// }

const gravity_strength = sg.uniform(3)
const particle_size = sg.uniform(.025)
const smoothing_radius = sg.uniform(0.25)
const paused = sg.uniform(0.);

let last_time = performance.now();
const delta = sg.uniform(0.0);
const timescale = sg.uniform(1/100000);

//Interactions
const target_density = sg.uniform(num_particles/400)
const pressure_multiplier = sg.uniform(1.5)

const pane = new Pane();
pane.addBinding(target_density, 'value', {max: 10, min: 1, label:"Target Density"})
pane.addBinding(pressure_multiplier, 'value', {max: 100, min: 0.1, label:"Pressure Multiplier"})
pane.addBinding(paused, 'value' , {options: {on:1.0, off:0.0}, label:"Paused"})
pane.addBinding(smoothing_radius, 'value', {min:0.0, max:1.0, step:0.01, label:"Smoothing Radius"})

function initialize_particles(destination_array) {
  for (let i = 0; i < num_particles*NUM_PROPERTIES; i+=NUM_PROPERTIES) {
    let particle_position = {
      x: (Math.random()*2)-1,
      y: (Math.random()*2)-1,
    }
    let particle_velocity = {
      x: 0,
      y: 0
    }
    destination_array[i] = particle_position.x
    destination_array[i+1] = particle_position.y
    destination_array[i+2] = particle_velocity.x
    destination_array[i+3] = particle_velocity.y
    destination_array[i+4] = 0.
    destination_array[i+5] = 0.
    destination_array[i+6] = 0.
    destination_array[i+7] = 0.
  }
}

initialize_particles(state)
const state_b = sg.buffer( state ),
    frame_u = sg.uniform( 0 ),
    res_u   = sg.uniform([ sg.width, sg.height ])


const render = await sg.render({
  shader: render_shader,
  data: [
    frame_u,
    res_u,
    state_b,
      particle_size,
      target_density,
  ],
  onframe() { frame_u.value++; let now = performance.now(); delta.value = (now-last_time)/1000; last_time = now; mouse_info.value = Mouse.values},
  count: num_particles,
  blend: true,
})

const dc = Math.ceil( num_particles / 64 )
const mouse_info = sg.uniform(Mouse.values)
const compute = sg.compute({
  shader: compute_shader,
  data:[
    res_u,
    state_b,
      gravity_strength,
    particle_size,
      sg.uniform(num_particles),
      smoothing_radius,
      target_density,
      pressure_multiplier,
      paused,
      timescale,
      mouse_info,
  ],
  dispatchCount: [ dc, dc, 1 ] 

})

const cache = sg.compute( {
  shader: cache_shader,
  data: [
      state_b,
      sg.uniform(num_particles),
      smoothing_radius,
  ],
  dispatchCount: [dc, dc, 1]
})
sg.run( cache, compute, render)
