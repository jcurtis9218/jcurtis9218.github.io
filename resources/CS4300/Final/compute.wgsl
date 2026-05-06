struct Particle {
  pos: vec2f,
  vel: vec2f,
  pressure: vec2f,
  density: f32,
  padding_1:f32
};

struct MouseInfo {
    x: f32,
    y: f32,
    button: f32,
}

@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(2) var<uniform> gravity_strength: f32;
@group(0) @binding(3) var<uniform> particle_size: f32;
@group(0) @binding(4) var<uniform> num_particles: f32;
@group(0) @binding(5) var<uniform> smoothing_radius:f32;
@group(0) @binding(6) var<uniform> target_density:f32;
@group(0) @binding(7) var<uniform> pressure_multiplier:f32;
@group(0) @binding(8) var<uniform> paused: f32;
@group(0) @binding(9) var<uniform> timescale: f32;
@group(0) @binding(10) var<uniform> mouse_info: MouseInfo;

const pi = radians(180.0);

fn cellindex( cell:vec3u ) -> u32 {
  let size = 8u;
  return cell.x + (cell.y * size) + (cell.z * size * size);
}



fn smoothing_function_derivative(radius:f32, dist:f32) -> f32 {
    if (dist >= radius) {
        return 0.;
    }
    let scale = 12./(pow(radius, 4) * pi);
    return (dist-radius) * scale;
}

const particle_mass = 0.01;

fn calculate_shared_pressure(density_a:f32, density_b:f32) -> f32 {
    return (density_to_pressure(density_a)+density_to_pressure(density_b))/2.;
}

fn pressure_at_particle(particle_index:u32) -> vec2f {
    var pressure_gradient = vec2f(0., 0.);
    for (var i = 0; i < i32(num_particles); i++) {
        let dist = distance(particles[i].pos, particles[particle_index].pos);
        if (dist > 0.00000001) {
            let dir = (particles[i].pos-particles[particle_index].pos)/dist;
            let slope = smoothing_function_derivative(smoothing_radius, dist);
            let density = particles[i].density;
            let shared_pressure = calculate_shared_pressure(density, particles[particle_index].density);
            pressure_gradient += shared_pressure*dir*slope*particle_mass/density;
        }
    }
    return pressure_gradient;
}

const input_radius = 0.5;
fn interaction_force(particle:Particle, mouse_position:vec2f, strength:f32) -> vec2f {
    let dist = distance(particle.pos, mouse_position);
    if (dist <= input_radius) {
        if (dist > 0.0001) {
            let direction_to_mouse = particle.pos-mouse_position;
            let falloff = 1.-pow(input_radius - length(direction_to_mouse), 0.5);
            return (falloff*strength*direction_to_mouse);
        }
    }
    return vec2f(0.0, 0.0);
}

fn density_to_pressure(density:f32) -> f32 {
    let density_error = density - target_density;
    let pressure = density_error * pressure_multiplier;
    return pressure;
}

const collision_damping = 0.7;

@compute
@workgroup_size(8,8)
fn cs(@builtin(global_invocation_id) cell:vec3u)  {
    let i = cellindex( cell );
    var particle = particles[ i ];
    if (paused < 0.5) {
        //Gravity
        particle.vel.y -= gravity_strength*timescale;

        //Collisions
        if (particle.pos.x-particle_size < -1) {
          particle.pos.x = -1+particle_size+0.01;
          particle.vel.x *= -1*collision_damping;
        }
        else if (particle.pos.x+particle_size > 1) {
          particle.pos.x = 1-particle_size+-0.01;
          particle.vel.x *= -1*collision_damping;
        }
        if (particle.pos.y-particle_size < -1) {
          particle.pos.y = -1+particle_size+0.01;
          particle.vel.y *= -1*collision_damping;
        }
        else if (particle.pos.y+particle_size > 1) {
          particle.pos.y = 1-particle_size+-0.01;
          particle.vel.y *= -1*collision_damping;
        }

        //Pressure
        let pressure_force = pressure_at_particle(i);
        let pressure_acceleration = pressure_force / particle.density;
        particle.vel += pressure_acceleration*timescale;

        //Mouse
        if (mouse_info.button > 0.5) {
            let force = interaction_force(particle, vec2f(mouse_info.x*2.+-1., -1*(mouse_info.y*2.+-1.)), -5000.);
            let acceleration = force/particle.density;
            particle.vel += acceleration*timescale;
        }

        if (length(particle.vel) >= 1000.*timescale) {
            particle.vel = normalize(particle.vel)*1000.*timescale;
        }
        particle.pos += particle.vel;
        particles[i] = particle;
    }
}
