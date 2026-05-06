@group(0) @binding(0) var<uniform> res :vec2f;
@group(0) @binding(1) var<uniform> grid_size : f32;
@group(0) @binding(2) var<storage> grid_activations: array<f32>;

fn activations_index(p:vec4f) -> i32 {
    let cell_index = i32(floor(p.y/grid_size)*floor(res.x/grid_size)+floor(p.x/grid_size));
    return cell_index*4;
}

@fragment
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    let grid_brightness = 0.2;
    let gridline_width = 2.0;
    let dot_size = 4.0;
    let dot_brightness = 0.2;
    var color = vec4f(0.0, 0.0, 0.0, 1.0);
    let is_gridline = min(1.0, step(pos.x%grid_size, gridline_width)+step(pos.y%grid_size, gridline_width));
    let is_dot = min(1.0, (step(grid_size-dot_size, pos.x%grid_size)+step(pos.x%grid_size, dot_size))*(step(grid_size-dot_size, pos.y%grid_size)+step(pos.y%grid_size, dot_size)));
    color.r += is_gridline*grid_brightness;
    color.g += is_gridline*grid_brightness;
    color.b += is_gridline*grid_brightness;
    color.r += is_dot*dot_brightness;
    color.g += is_dot*dot_brightness;
    color.b += is_dot*dot_brightness;

    let cell_index = activations_index(pos);
    let top_left = grid_activations[cell_index];
    let top_right = grid_activations[cell_index+1];
    let bottom_left = grid_activations[cell_index+2];
    let bottom_right = grid_activations[cell_index+3];

    var brightness = 0.0;

    let num_corners_active = top_left+top_right+bottom_left+bottom_right;
    if (num_corners_active == 0.0) {
        brightness = 0.0;
    }
    else if (num_corners_active == 1.0) {
        let active_corner = vec2f(0.0, 0.0)*top_left+vec2f(1.0, 0.0)*top_right+vec2f(0.0, 1.0)*bottom_left+vec2f(1.0, 1.0)*bottom_right;
        var x = 0.0;
        var y = 0.0;
        var edge_factor = 0.0;
        if (active_corner.x == 0.0) {
            x = step(pos.x%grid_size, grid_size/2.0);
            edge_factor = -1.0;
        }
        else {
            x = step(grid_size/2.0, pos.x%grid_size);
            edge_factor = 1.0;
        }
        if (active_corner.y == 0.0) {
            y = step(pos.y%grid_size, grid_size/2.0);
            if (edge_factor < 0.0) {
                edge_factor = step(pos.y%grid_size, grid_size/2.0-pos.x%grid_size);
            }
            else {
                edge_factor = step(pos.y%grid_size, pos.x%grid_size-(grid_size/2.0));
            }
        }
        else {
            y = step(grid_size/2.0, pos.y%grid_size);
            if (edge_factor < 0.0) {
                edge_factor = step(pos.x%grid_size+(grid_size/2.0), pos.y%grid_size);
            }
            else {
                edge_factor = step(grid_size-pos.x%grid_size+grid_size/2.0, pos.y%grid_size);
            }
        }
        brightness = x*y*edge_factor;
    }

    else if (num_corners_active == 2.0) {
        var b = 0.0;
        if (top_left > 0.5) {
            if (top_right > 0.5) {
                b = step(pos.y%grid_size, grid_size/2.0);
            }
            else if (bottom_left > 0.5) {
                b = step(pos.x%grid_size, grid_size/2.0);
            }
            else if (bottom_right > 0.5) {
                b = (step(grid_size/2.0, pos.x%grid_size)*step(grid_size/2.0, pos.y%grid_size)*step(pos.y%grid_size, pos.x%grid_size))+(step(pos.x%grid_size, grid_size/2.0)*step(pos.y%grid_size, grid_size-(pos.x%grid_size))*step(pos.x%grid_size, pos.y%grid_size))/2.0;
            }
        }
        else if (top_right > 0.5) {
            if (bottom_right > 0.5) {
                b = step(grid_size/2.0, pos.x%grid_size);
            }
            else if (bottom_left > 0.5) {
                b = (step(grid_size/2.0, pos.x%grid_size)*step(pos.y%grid_size, grid_size/2.0)*step(pos.y%grid_size, grid_size/2.0-pos.x%grid_size)+(step(pos.x%grid_size, grid_size/2.0)*step(grid_size/2.0, pos.y%grid_size)*step(pos.x%grid_size+(grid_size/2.0), pos.y%grid_size)))/2.0;
            }
        }
        else if (bottom_left > 0.5) {
            if (bottom_right > 0.5) {
                b = step(grid_size/2.0, pos.y%grid_size);
            }
        }
        brightness = b;
    }
    else if (num_corners_active == 3.0) {
        let active_corner = vec2f(0.0, 0.0)*(1.0-top_left)+vec2f(1.0, 0.0)*(1.0-top_right)+vec2f(0.0, 1.0)*(1.0-bottom_left)+vec2f(1.0, 1.0)*(1.0-bottom_right);
        var x = 0.0;
        var y = 0.0;
        var edge_factor = 0.0;
        if (active_corner.x == 0.0) {
            x = step(pos.x%grid_size, grid_size/2.0);
            edge_factor = -1.0;
        }
        else {
            x = step(grid_size/2.0, pos.x%grid_size);
            edge_factor = 1.0;
        }
        if (active_corner.y == 0.0) {
            y = step(pos.y%grid_size, grid_size/2.0);
            if (edge_factor < 0.0) {
                edge_factor = step(pos.y%grid_size, grid_size/2.0-pos.x%grid_size);
            }
            else {
                edge_factor = step(pos.y%grid_size, pos.x%grid_size-(grid_size/2.0));
            }
        }
        else {
            y = step(grid_size/2.0, pos.y%grid_size);
            if (edge_factor < 0.0) {
                edge_factor = step(pos.x%grid_size+(grid_size/2.0), pos.y%grid_size);
            }
            else {
                edge_factor = step(grid_size-pos.x%grid_size+grid_size/2.0, pos.y%grid_size);
            }
        }
        brightness = 1.0-(x*y*edge_factor);
    }
    else if (num_corners_active == 4.0) {
        brightness = 1.0;
    }
    else {
        brightness = 0.0;
    }
    let base_color = vec3f(73.0/256.0, 144.0/256.0, 227.0/256.0);
    let modulated = base_color*brightness;
    return vec4f(modulated.r, modulated.g, modulated.b, 1.0);
}