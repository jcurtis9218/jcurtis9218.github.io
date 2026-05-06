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
@group(0) @binding(3) var<storage, read_write> grid_activations: array<f32>;
@group(0) @binding(4) var<storage, read_write> grid_activations_out: array<f32>;
@group(0) @binding(5) var<uniform> grid_size: f32;
@group(0) @binding(6) var<uniform> res: vec2f;
@group(0) @binding(7) var<uniform> activation_threshold: f32;

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

fn map_range(in_min:f32, in_max:f32, out_min:f32, out_max:f32, value:f32) -> f32 {
    let in_range = in_max-in_min;
    let progress = (value-in_min)/in_range;
    let out_range = out_max-out_min;
    return out_range*progress+out_min;
}

fn pixel_position_to_world_position(pixel_pos:vec2f) -> vec2f {
    return vec2f(
    map_range(0.0, res.x, -1.0, 1.0, pixel_pos.x),
    map_range(0.0, res.y, 1.0, -1.0, pixel_pos.y)
    );
}

@compute
@workgroup_size(8,8)
fn cs(@builtin(global_invocation_id) cell:vec3u)  {
    let cells_x = floor(f32(res.x)/grid_size);
    let cells_y = floor(f32(res.y)/grid_size);

    if (f32(cell.x) >= cells_x || f32(cell.y) >= cells_y) {
        return;
    }

    let ind = i32(f32(cell.y)*cells_x+f32(cell.x));
    let cell_ind = f32(ind);
    let cell_topleft_pixel = vec2f(f32(cell.x)*grid_size, f32(cell.y)*grid_size);
    let cell_topleft = pixel_position_to_world_position(cell_topleft_pixel);
    let cell_topright = pixel_position_to_world_position(vec2f(cell_topleft_pixel.x+grid_size, cell_topleft_pixel.y));
    let cell_bottomleft = pixel_position_to_world_position(vec2f(cell_topleft_pixel.x, cell_topleft_pixel.y+grid_size));
    let cell_bottomright = pixel_position_to_world_position(vec2f(cell_topleft_pixel.x+grid_size, cell_topleft_pixel.y+grid_size));

    var particles_in_cell = 0.0;
    for (var i = 0; i < i32(num_particles); i++) {
        let p = particles[i];
        if (p.pos.x > cell_topleft.x && p.pos.x <= cell_topright.x) {
            if (p.pos.y > cell_topleft.y && p.pos.y <= cell_bottomleft.y) {
                particles_in_cell += 1.0;
            }
        }
    }

    grid_activations_out[ind*4] = step(activation_threshold, density_at_point(cell_topleft));
    grid_activations_out[ind*4+1] = step(activation_threshold, density_at_point(cell_topright));
    grid_activations_out[ind*4+2] = step(activation_threshold, density_at_point(cell_bottomleft));
    grid_activations_out[ind*4+3] = step(activation_threshold, density_at_point(cell_bottomright));
}

