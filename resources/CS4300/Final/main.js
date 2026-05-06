import { default as gulls } from './gulls.js'
import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';
import {default as Mouse} from './helpers/mouse.js';

const sg = await gulls.init(),
      render_shader  = await gulls.import( './render.wgsl' ),
      compute_shader = await gulls.import( './compute.wgsl' ),
      cache_shader  = await gulls.import( './calculate_cached.wgsl' ),
      compute_grid_activations_shader = await gulls.import( './compute_grid.wgsl' ),
      mesh_render_shader = gulls.constants.vertex + await gulls.import('/mesh_render.wgsl' )

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

// const pane = new Pane();
// pane.addBinding(target_density, 'value', {max: 10, min: 1, label:"Target Density"})
// pane.addBinding(pressure_multiplier, 'value', {max: 100, min: 0.1, label:"Pressure Multiplier"})
// pane.addBinding(paused, 'value' , {options: {on:1.0, off:0.0}, label:"Paused"})
// pane.addBinding(smoothing_radius, 'value', {min:0.0, max:1.0, step:0.01, label:"Smoothing Radius"})

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

const grid_size = 8

let initial_grid_activations = new Float32Array(Math.floor(window.innerWidth/grid_size)*Math.floor(window.innerHeight/grid_size)*4)
for (let i = 0; i < initial_grid_activations.length; i++) {
  initial_grid_activations[i] = 0;
}

const grid_activations = sg.buffer(initial_grid_activations)
const grid_activations_b = sg.buffer(initial_grid_activations)
const activation_threshold = sg.uniform(target_density.value*0.8)

const cells_x = Math.ceil(window.innerWidth / grid_size)
const cells_y = Math.ceil(window.innerHeight / grid_size)

const workgroup_size = 8

const grid_dispatch_x = Math.ceil(cells_x/workgroup_size);
const grid_dispatch_y = Math.ceil(cells_y/workgroup_size);

const compute_grid_activations = sg.compute( {
  shader: compute_grid_activations_shader,
  data: [
    state_b,
    sg.uniform(num_particles),
    smoothing_radius,
      sg.pingpong(grid_activations, grid_activations_b),
      sg.uniform(grid_size),
      res_u,
      activation_threshold,
  ],
  dispatchCount: [grid_dispatch_x, grid_dispatch_y, 1],
})

const mesh_render = await sg.render({
  shader: mesh_render_shader,
  data: [
      res_u,
      sg.uniform(grid_size),
      sg.pingpong(grid_activations, grid_activations_b),
  ],
  blend: true
})
sg.run( cache, compute, compute_grid_activations, render, mesh_render)
