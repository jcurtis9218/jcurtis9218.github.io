@group(0) @binding(0) var<uniform> frame : f32;
@group(0) @binding(1) var<uniform> resolution : vec2f;
@group(0) @binding(2) var<uniform> mouse : vec3f;
@group(0) @binding(3) var<uniform> voronoiZ : f32;
@group(0) @binding(4) var<uniform> enableVoronoi : f32;

struct Vec4Array {
    data: array<vec4<f32>>
};
@group(0) @binding(5) var<storage, read> voronoi_points : Vec4Array;
@group(0) @binding(6) var<uniform> grid_width : f32;
@group(0) @binding(7) var<uniform> grid_height: f32;
@group(0) @binding(8) var<uniform> grid_depth : f32;
@group(0) @binding(9) var<uniform> cell_size : f32;
@group(0) @binding(10) var<uniform> draw_grid : f32;
@group(0) @binding(11) var<uniform> enable_video : f32;
@group(0) @binding(12) var videoSampler : sampler;
@group(1) @binding(0) var videoBuffer : texture_external;

const aspect = vec2f(1., 1080./1920.);

//Tile index offsets
const move_forward = 1;
const move_backward = -1;
const move_down = 50;
const move_up = -50;
const move_right = 500;
const move_left = -500;

fn tile_topleft_at_position(position:vec2f) -> vec2f {
    let x_excess = position.x % cell_size;
    let x_start = position.x - x_excess;
    let y_excess = position.y % cell_size;
    let y_start = position.y - y_excess;
    return vec2f(x_start, y_start);
}

fn point_in_tile_at_position(check_point:vec2f, position:vec2f) -> f32 {
    let topleft = tile_topleft_at_position(position);
    let horizontal_start = step(topleft.x, check_point.x);
    let horizontal_end = 1-step(topleft.x+cell_size, check_point.x);
    let vertical_start = step(topleft.y, check_point.y);
    let vertical_end = 1-step(topleft.y+cell_size, check_point.y);
    return horizontal_start*horizontal_end*vertical_start*vertical_end;
}

fn tile_index_at_xy_position(position:vec2f) -> i32{
    var tile_index = 0;

    let x_offset = i32(floor(position.x / cell_size));
    let y_offset = i32(floor(position.y / cell_size));

    tile_index = i32(move_right*x_offset+move_down*y_offset);
    return tile_index;
}

fn tile_index_at_xyz_position(position:vec3f) -> i32{
    var tile_index = 0;

    let x_offset = i32(floor(position.x / cell_size));
    let y_offset = i32(floor(position.y / cell_size));
    let z_offset = i32(floor(position.z / cell_size));

    tile_index = i32(move_right*x_offset+move_down*y_offset+move_forward*z_offset);
    return tile_index;
}

@fragment
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
    var color = vec4f(0.0, 0.0, 0.0, 1.0);

    let p = pos.xy / resolution;
    let npos = vec3f(pos.x/resolution.x, pos.y/resolution.y, voronoiZ);


    var st = pos.xy/resolution;
    st.y *= grid_height/cell_size;
    st.x *= grid_width/cell_size;
    var i_st = floor(st);
    var f_st = fract(st);


    let current_topleft = tile_topleft_at_position(p);
    let current_tile_index = tile_index_at_xyz_position(npos);
    var min_dist = 1.0;
    var nearestPointIndex = current_tile_index;
    for (var x = -1.; x <= 1.; x = x + 1.) {
        for (var y = -1.; y <= 1.; y = y + 1.) {
            for (var z = -1.; z <= 1.; z = z + 1.) {
                let next_tile_index = current_tile_index+i32(round(move_right*x))+i32(round(move_down*y))+i32(round(move_forward*z));
                if (next_tile_index >= 0) {
                    let next_tile_voronoi_point = voronoi_points.data[next_tile_index];
                    let dist = distance(npos, next_tile_voronoi_point.xyz);
                    if (dist < min_dist) {
                        min_dist = dist;
                        nearestPointIndex = next_tile_index;
                    }
                }
            }
        }
    }
    min_dist*=4.;

    if (enableVoronoi > 0.5) {
        color = vec4f(min_dist, min_dist, min_dist, 1.);
    }



    var videoSamplePoint = vec2f(p.x, p.y);
    if (enableVoronoi > 0.5) {
        let nearestPoint = voronoi_points.data[nearestPointIndex].xy;
        var samplePointOffset = nearestPoint-videoSamplePoint;
        let offsetFactor = 1.-min_dist;
        samplePointOffset *= offsetFactor;
        videoSamplePoint = -samplePointOffset+nearestPoint;
    }

    let video = textureSampleBaseClampToEdge(videoBuffer, videoSampler, videoSamplePoint);
    if (enable_video > 0.5) {
        color = video;
    }

    let grid_factor = step(0.98, f_st.x) + step(0.98, f_st.y);
         if (grid_factor > 0.5 && draw_grid > 0.5) {
             color.r = 1.;
             color.g = 0.;
             color.b = 0.;
         }
  return color;
}