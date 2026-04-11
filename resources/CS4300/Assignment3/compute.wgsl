@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> chemical_a_in: array<f32>;
@group(0) @binding(2) var<storage, read_write> chemical_a_out: array<f32>;
@group(0) @binding(3) var<storage> chemical_b_in: array<f32>;
@group(0) @binding(4) var<storage, read_write> chemical_b_out: array<f32>;
@group(0) @binding(5) var<uniform> feed_rate:f32;
@group(0) @binding(6) var<uniform> kill_rate:f32;
@group(0) @binding(7) var<uniform> diffusion_rate_a:f32;
@group(0) @binding(8) var<uniform> diffusion_rate_b:f32;
@group(0) @binding(9) var<uniform> diffusion_bias_x:f32;
@group(0) @binding(10) var<uniform> diffusion_bias_y:f32;
@group(0) @binding(11) var<uniform> paused:f32;

const delta = 1.0;

fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}



fn laplacian_a(cell:vec3i, laplacian_convolution:array<f32, 9>) -> f32 {
    var laplacian_index = 0;
    var total = 0.;
    for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
           let cell_index = index(cell.x+x, cell.y+y);
           let value = chemical_a_in[cell_index];
           total += value*laplacian_convolution[laplacian_index];
           laplacian_index++;
        }
    }
    return total;
}

fn laplacian_b(cell:vec3i, laplacian_convolution:array<f32, 9>) -> f32 {
    var laplacian_index = 0;
    var total = 0.;
    for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
           let cell_index = index(cell.x+x, cell.y+y);
           let value = chemical_b_in[cell_index];
           total += value*laplacian_convolution[laplacian_index];
           laplacian_index++;
        }
    }
    return total;
}

fn update_a(cell:vec3i, laplacian_convolution:array<f32, 9>) -> f32 {
    let cell_index = index(cell.x, cell.y);
    let current_a = chemical_a_in[cell_index];
    if (paused > 0.5) {
        return current_a;
    }
    let current_b = chemical_b_in[cell_index];
    let a_prime = current_a+(diffusion_rate_a*laplacian_a(cell, laplacian_convolution)-(current_a*current_b*current_b)+feed_rate*(1.0-current_a))*delta;
    return a_prime;
}

fn update_b(cell:vec3i, laplacian_convolution:array<f32, 9>) -> f32 {
    let cell_index = index(cell.x, cell.y);
    let current_a = chemical_a_in[cell_index];
    let current_b = chemical_b_in[cell_index];
    if (paused > 0.5) {
        return current_b;
    }
    let b_prime = current_b+(diffusion_rate_b*laplacian_b(cell, laplacian_convolution)+(current_a*current_b*current_b)-(kill_rate+feed_rate)*current_b)*delta;
    return b_prime;
}

@compute
@workgroup_size(8,8)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {
  let cell = vec3i(_cell);
  var laplacian_convolution = array<f32, 9>(
        0.05*(1.0-diffusion_bias_y)*(1.0+diffusion_bias_x), 0.2*(1.0+diffusion_bias_x), 0.05*(1.0+diffusion_bias_y)*(1.0+diffusion_bias_x),
        0.2*(1.0-diffusion_bias_y), -1., 0.2*(1.0+diffusion_bias_y),
        0.05*(1.0-diffusion_bias_y)*(1.0-diffusion_bias_x), 0.2*(1.0-diffusion_bias_x), 0.05*(1.0+diffusion_bias_y)*(1.0-diffusion_bias_x)
  );
  let i = index(cell.x, cell.y);
  chemical_a_out[i] = update_a(cell, laplacian_convolution);
  chemical_b_out[i] = update_b(cell, laplacian_convolution);
}
