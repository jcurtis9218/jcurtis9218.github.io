import { default as seagulls } from './gulls.js'

const WORKGROUP_SIZE = 64,
    NUM_AGENTS = 256,
    DISPATCH_COUNT = [NUM_AGENTS/WORKGROUP_SIZE,1,1],
    GRID_SIZE = 2,
    STARTING_AREA = .3

const W = Math.round( window.innerWidth  / GRID_SIZE ),
    H = Math.round( window.innerHeight / GRID_SIZE )

const render_shader = seagulls.constants.vertex + `
@group(0) @binding(0) var<storage> pheromones: array<f32>;
@group(0) @binding(1) var<storage> render: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = floor( pos.xy / ${GRID_SIZE}.);
  
  let pidx = grid_pos.y  * ${W}. + grid_pos.x;
  let p = pheromones[ u32(pidx) ];
  let v = render[ u32(pidx) ];
    var out = vec4(0.0, 0.0, 0.0, 1.0);
  if (p < 0.5) {
    out = vec4(0.0, 0.0, 0.0, 1.0);
  }
  else if (p < 1.5) {
    out.r = 1.0;
  }
  else if (p < 2.5) {
    out.g = 1.0;
  }
  else if (p < 3.5) {
    out.b = 1.0;
  }
  if (v > 0.5) {
    out = vec4(1.0, 1.0, 1.0, 1.0);
  }
  
  return out;
}`

const compute_shader =`
struct Vant {
  pos: vec2f,
  dir: f32,
  flag: f32
}

@group(0) @binding(0) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(1) var<storage, read_write> pheremones: array<f32>;
@group(0) @binding(2) var<storage, read_write> render: array<f32>;
@group(0) @binding(3) var<uniform> frame: f32;

fn pheromoneIndex( vant_pos: vec2f ) -> u32 {
  let width = ${W}.;
  return u32( abs( vant_pos.y % ${H}. ) * width + vant_pos.x );
}

@compute
@workgroup_size(${WORKGROUP_SIZE},1,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let pi2   = ${Math.PI*2}; 
  var vant:Vant  = vants[ cell.x ];

  let pIndex    = pheromoneIndex( vant.pos );
  let pheromone = pheremones[ pIndex ];

  if (vant.flag == 0. && true) {
      if( pheromone != 0. ) {
        vant.dir += -0.1; 
        if (pheremones[pIndex] != 2.0) {
        pheremones[ pIndex ] = 0.;  // set pheromone flag
        }
      }
      else{
        vant.dir += 0.1; // turn 90 degrees counter-clockwise
        if (pheremones[pIndex] != 2.0) {
        pheremones[ pIndex ] = 1.;  // unset pheromone flag
        }
      }
  }
  else if (vant.flag == 1. && true) {
    if (pheromone != 0. && pheromone != 2.) {
        vant.dir += -0.15;
        pheremones[ pIndex ] = 2.;  // set pheromone flag
        }
    else {
        vant.dir += 0.15;
        pheremones[pIndex] = 2.;
        if (frame % 1000.0 <= 5.0 && frame > 20.0) {
            vant.dir = 0.5;
        }
    }
  }
  else if (vant.flag == 2. && true) {
    if (pheremones[pIndex] == 0.) {
        pheremones[pIndex] = 3.0;
    }
    var offset = vec2(0.0, 0.0);
    if (sin(vant.dir*pi2) > 0.5) {
        offset.x = 1.0;
    }
    else if (sin(vant.dir*pi2) < -0.5) {
        offset.x = -1.0;
    }
    if (cos(vant.dir*pi2) > 0.5) {
        offset.y = 1.0;
    }
    else if (cos(vant.dir*pi2) < -0.5) {
        offset.y = -1.0;
    }
    let offset_pheromone_index = pheromoneIndex(vant.pos+(offset));
    let offset_pheromone = pheremones[offset_pheromone_index];
    if (offset_pheromone < 0.5) {
        //do nothing
    }
    else if (offset_pheromone < 1.5) {
        vant.dir += 0.2;
    }
    else if (offset_pheromone < 2.5) {
        vant.dir -= 0.2;
    }
    else if (offset_pheromone < 3.5) {
        vant.dir += 0.1;
        
    }
  }

  // calculate direction based on vant heading
  let dir = vec2f( sin( vant.dir * pi2 ), cos( vant.dir * pi2 ) );
  
  vant.pos = round( vant.pos + dir ); 

  vants[ cell.x ] = vant;
  
  // we'll look at the render buffer in the fragment shader
  // if we see a value of one a vant is there and we can color
  // it accordingly. in our JavaScript we clear the buffer on every
  // frame.
  render[ pIndex ] = 1.;
}`

const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Float32Array( W*H ) // hold pheromone data
const vants_render = new Float32Array( W*H ) // hold info to help draw vants
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

const offset = .5 - STARTING_AREA / 2
for( let i = 0; i < NUM_AGENTS * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
    vants[ i ]   = Math.floor( (offset+Math.random()*STARTING_AREA) * W ) // x
    vants[ i+1 ] = Math.floor( (offset+Math.random()*STARTING_AREA) * H ) // y
    vants[ i+2 ] = 0 // direction
    vants[ i+3 ] = Math.round( Math.random()*2  ) // vant behavior type
}

const sg = await seagulls.init()
const pheromones_b = sg.buffer( pheromones )
const vants_b  = sg.buffer( vants )
const render_b = sg.buffer( vants_render )
const frame = sg.uniform(0)
console.log(pheromones_b)
const render = await sg.render({
    shader: render_shader,
    data:[
        pheromones_b,
        render_b
    ],
})

const compute = sg.compute({
    shader: compute_shader,
    data:[
        vants_b,
        pheromones_b,
        render_b,
        frame,
    ],
    onframe() { render_b.clear(); frame.value = frame.value+1 },
    dispatchCount:DISPATCH_COUNT,
    times:1,
})

sg.run( compute, render )