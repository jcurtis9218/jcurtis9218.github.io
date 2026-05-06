struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>
}

struct Particle {
  pos: vec2f,
  vel: vec2f,
  pressure: vec2f,
  density:f32,
  padding_1:f32
};

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> state: array<Particle>;
@group(0) @binding(3) var<uniform> particle_size:f32;
@group(0) @binding(4) var<uniform> target_density:f32;

@vertex 
fn vs( input: VertexInput ) ->  VertexOutput {
  let size = input.pos * particle_size;
  let aspect = res.y / res.x;
  let p = state[ input.instance ];
  let output = VertexOutput(vec4f( p.pos.x - size.x * aspect, p.pos.y + size.y, 0., 1.));
  return output;
}

@fragment 
fn fs( input: VertexOutput ) -> @location(0) vec4f {
  return vec4f(0.1, 0.1, 0.5, 0.7);
//  return vec4f( input.position.x / res.x, input.position.y / res.y, input.density , 0.7 );
}
