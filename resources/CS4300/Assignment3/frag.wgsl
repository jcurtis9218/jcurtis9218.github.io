@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> chemical_a: array<f32>;
@group(0) @binding(2) var<storage> chemical_a_previous: array<f32>;
@group(0) @binding(3) var<storage> chemical_b: array<f32>;
@group(0) @binding(4) var<storage> chemical_b_previous: array<f32>;
@group(0) @binding(5) var<uniform> difference_mode:f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let idx : u32 = u32( pos.y * res.x + pos.x );
  let a = chemical_a[ idx ];
  let b = chemical_b[idx];
  if (difference_mode < 0.5) {
    return vec4f( a,b,0., 1.);
  }
  else {
    let previous_a = chemical_a_previous[idx];
    let previous_b = chemical_b_previous[idx];
    return vec4f(step(0.001, abs(a-previous_a)), step(0.001, abs(b-previous_b)), 0., 1.0);
  }
}
