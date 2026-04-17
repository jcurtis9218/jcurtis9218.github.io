struct Particle {
  pos: vec2f,
  vel: vec2f,
  pressure: vec2f,
  density: f32,
  padding_1:f32
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> num_particles: f32;
@group(0) @binding(2) var<uniform> smoothing_radius: f32;

const pi = 3.1415926;
const particle_mass = 0.01;

fn cellindex( cell:vec3u ) -> u32 {
  let size = 8u;
  return cell.x + (cell.y * size) + (cell.z * size * size);
}

fn smoothing_function(radius:f32, dist:f32) -> f32 {
    if (dist >= radius) {
        return 0.;
    }
    let volume = (pi * pow(radius, 4.)) / 6.;
    return (radius - dist) * (radius - dist) / volume;
}

fn density_at_point(pos:vec2f) -> f32 {
    var density = 0.;
    for (var i = 0; i < i32(num_particles); i++) {
        let dist = distance(particles[i].pos, pos);
        let influence = smoothing_function(smoothing_radius, dist);
        density += particle_mass*influence;
    }
    return density;
}

@compute
@workgroup_size(8,8)
fn cs(@builtin(global_invocation_id) cell:vec3u)  {
    let i = cellindex( cell );
    var particle = particles[ i ];

    particle.density = density_at_point(particle.pos);
    particles[i] = particle;
}

