// PRESS CTRL+ENTER TO RELOAD SHADER
// reference at https://codeberg.org/charlieroberts/TheSchwartz#reference
// for wgsl reference see https://webgpu.rocks/wgsl/functions/numeric/
const framerate = 240.; //Change this to match your monitor's framerate
const target_framerate = 60.;
const duration_seconds = 60.;

const base_num_swipes = 40;

const wave_speed = 400.;
const wave_amplitude = 0.1;

const blur_radius = 5.;

const draw_radius = 0.02;

const phase_1_start = 0.;
const phase_1_length = 1./60.;

const phase_2_start = phase_1_start + phase_1_length;
const phase_2_length = 1./60.;

const phase_3_start = phase_2_start + phase_2_length;
const phase_3_length = 1./60.;

const phase_4_start = phase_3_start + phase_3_length;
const phase_4_length = 1./60.;

const phase_5_start = phase_4_start + phase_4_length;
const phase_5_length = 1./60.;

const phase_6_start = phase_5_start + phase_5_length;
const phase_6_length = 1./60.;

const phase_7_start = phase_6_start + phase_6_length;
const phase_7_length = 14./60.;

const phase_8_start = phase_7_start + phase_7_length;
const phase_8_length = 10./60.;

const phase_9_start = phase_8_start + phase_8_length;
const phase_9_length = 5./60.;

const phase_10_start = phase_9_start + phase_9_length;
const phase_10_length = 5./60.;

const phase_11_start = phase_10_start + phase_10_length;
const phase_11_length = 1./60.;

const phase_12_start = phase_11_start + phase_11_length;
const phase_12_length = 4./60.;

const phase_13_start = phase_12_start + phase_12_length;
const phase_13_length = 1.-phase_12_length-phase_11_length-phase_10_length-phase_9_length-phase_8_length-phase_7_length-phase_6_length-phase_5_length-phase_4_length-phase_3_length-phase_2_length-phase_1_length;

fn lerp(from_value:f32, to_value:f32, progress:f32) -> f32 {
	return ((to_value-from_value)*progress)+from_value;
}

fn map_range(input_min:f32, input_max:f32, output_min:f32, output_max:f32, value:f32) -> f32 {
	let progress = (clamp(value, input_min, input_max)-input_min)/(input_max-input_min);
	return lerp(output_min, output_max, progress);
}

fn swipe(normalized_pos:vec2f, horizontal:f32, offset:f32, width:f32, start_time:f32, current_time:f32, duration:f32) -> f32 {
	var progress = (current_time-start_time)/duration;
	progress = clamp(progress, 0., 1.);
	var included = 1.;
	let compare = normalized_pos.x*(1.-horizontal)+normalized_pos.y*horizontal;
	included = included * step(offset-width, compare) * step(-(offset+width), -compare) * (step(normalized_pos.x*horizontal+normalized_pos.y*(1.-horizontal), progress));

	return included;
}

fn cycle_color(current_color:vec4f) -> vec4f {
	if (current_color.r == 0.) {
		if (current_color.g == 0.) {
			return vec4f(1.0, 0., 0., 1.0);
		}
		else {
			return vec4f(0., 0., 1.0, 1.0);
		}
	}
	else if (current_color.g == 0.) {
		if (current_color.b == 0.) {
			return vec4f(0., 1.0, 0., 1.0);
		}
	}

	return vec4f(0.0, 0.0, 0.0, 1.0);
}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  // get normalized texture coordinates (aka uv) in range 0-1	
  let npos  = uvN( pos.xy );
  let time = (seconds()/duration_seconds)*(target_framerate/framerate);
	var output = vec4f(0.0, 0.0, 0.0, 0.0);
	var num_swipes = 10.;
	var next_color = vec4f(1.0, 0., 0., 1.0);
	var phase = 0;

	if (time <= phase_1_length) {
		phase = 1;
	}
	else if (time <= phase_2_start + phase_2_length) {
		phase = 2;
	}
	else if (time <= phase_3_start + phase_3_length) {
		phase = 3;
	}
	else if (time <= phase_4_start + phase_4_length) {
		phase = 4;
	}
	else if (time <= phase_5_start + phase_5_length) {
		phase = 5;
	}
	else if (time <= phase_6_start + phase_6_length) {
		phase = 6;
	}
	else if (time <= phase_7_start + phase_7_length) {
		phase = 7;
	}
	else if (time <= phase_8_start + phase_8_length) {
		phase = 8;
	}
	else if (time <= phase_9_start + phase_9_length) {
		phase = 9;
	}
	else if (time <= phase_10_start + phase_10_length) {
		phase = 10;
	}
	else if (time <= phase_11_start + phase_11_length) {
		phase = 11;
	}
	else if (time <= phase_12_start + phase_12_length) {
		phase = 12;
	}
	else if (time >= phase_13_start) {

		phase = 13;

	}


	if (phase == 1) {
		num_swipes = base_num_swipes;
		for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 1., i/num_swipes, 1/num_swipes, 0., time, phase_1_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}
	else if (phase == 2) {
		num_swipes = base_num_swipes*2;
		for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 1., i/num_swipes, 1/num_swipes, phase_2_start, time, phase_2_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}
	else if (phase == 3) {
	num_swipes = base_num_swipes*2*2;
	for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 1., i/num_swipes, 1/num_swipes, phase_3_start, time, phase_3_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}

	else if (phase == 4) {
		num_swipes = base_num_swipes;
		for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 0., i/num_swipes, 1/num_swipes, phase_4_start, time, phase_4_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}
	else if (phase == 5) {
		num_swipes = base_num_swipes*2;
		for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 0., i/num_swipes, 1/num_swipes, phase_5_start, time, phase_5_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}
	else if (phase == 6) {
		num_swipes = base_num_swipes*2*2;
		for (var i:f32 = 0; i < num_swipes; i = i + 1.) {
			if (swipe(npos, 0., i/num_swipes, 1/num_swipes, phase_6_start, time, phase_6_length) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}
		}
	}

	else if (phase == 7 || phase == 8 || phase == 9 || phase == 10) {
		num_swipes = base_num_swipes*2;
		for (var pair_index:f32 = 0; pair_index < num_swipes; pair_index = pair_index + 1.) {
			if (swipe(npos, 1., pair_index/num_swipes, 1/num_swipes, phase_7_start+((pair_index/num_swipes)*phase_7_length), time, phase_7_length/num_swipes) > 0.1) {
				output = next_color;
				if (output.a >= 0.1) {
				break;
			}
			}
			next_color = cycle_color(next_color);
			if (swipe(npos, 0., pair_index/num_swipes, 1/num_swipes, phase_7_start+((pair_index/num_swipes)*phase_7_length)+phase_7_length/num_swipes/2, time, phase_7_length/num_swipes) > 0.1) {
				output = next_color;
			}
			next_color = cycle_color(next_color);
			if (output.a >= 0.1) {
				break;
			}

		}
		

		if (phase == 8 || phase == 9 || phase == 10 || phase == 11) {
			if (swipe(npos, 1., 0.5, 0.25*clamp((time-phase_8_start)/phase_8_length, 0., 1.), phase_8_start, time, phase_8_length) > 0.1) {
				output = vec4(0.0, 0.0, 0.0, 1.0);
			}
		}
		
		if (phase == 9 || phase == 10 || phase == 11) {
			if (swipe(npos, 1., 0.5, 0.2, phase_9_start, time, phase_9_length/2.) > 0.1) {
				let thickness = 0.1;
				let wave = sin(npos.x*wave_speed+(time*2000.))*wave_amplitude+0.5;

				let curve = smoothstep(wave - thickness, wave, npos.y) - smoothstep(wave, wave + thickness, npos.y);

				output = vec4f(curve, curve, curve, 1.0);
			}
			else if (swipe(npos, 1., 0.125, 0.05, phase_9_start+phase_9_length/2., time, phase_9_length/2.) > 0.1) {
				output = vec4f(1.0, 1.0, 1.0, 1.0);
			}
			else if (swipe(npos, 1., 0.875, 0.05, phase_9_start+phase_9_length/2., time, phase_9_length/2.) > 0.1) {
				output = vec4f(1.0, 1.0, 1.0, 1.0);
			}
		}

		if (phase == 10 || phase == 11) {
			if (swipe(npos, 1., 0.125, map_range(phase_10_start, phase_10_start+phase_10_length/2., 0.05, 0.1, time), phase_9_start, time, phase_9_length) > 0.1) {
				output = vec4f(1.0, 1.0, 1.0, 1.0);
			}
			else if (swipe(npos, 1., 0.875, map_range(phase_10_start, phase_10_start+phase_10_length/2., 0.05, 0.1, time), phase_9_start, time, phase_9_length) > 0.1) {
				output = vec4f(1.0, 1.0, 1.0, 1.0);
			}

			if (time >= phase_10_start+phase_10_length/2.) {
				let thickness = 0.05;
				let top_wave = sin(npos.x*wave_speed+(time*2000.))*wave_amplitude+0.125;
				let bottom_wave = sin(npos.x*wave_speed+(time*2000.))*wave_amplitude+0.875;

				let top_curve = 1.-(smoothstep(top_wave - thickness, top_wave, npos.y) - smoothstep(top_wave, top_wave + thickness, npos.y));
				let bottom_curve = 1.-(smoothstep(bottom_wave - thickness, bottom_wave, npos.y) - smoothstep(bottom_wave, bottom_wave+thickness, npos.y));
				
				if (swipe(npos, 1., 0.125, 0.1, phase_10_start+phase_10_length/2., time, phase_10_length/2.) > 0.1) {
					output = vec4f(top_curve, top_curve, top_curve, 1.0);
				}
				else if (swipe(npos, 1., 0.875, 0.1, phase_10_start+phase_10_length/2., time, phase_10_length/2.) > 0.1) {
					output = vec4f(bottom_curve, bottom_curve, bottom_curve, 1.0);
				}
			}
		}

		
		

	}

	else if (phase == 11) {
		output = lastframe(npos);
	}

	else if (phase == 12 || phase == 13) {

		var average_color = vec4f(0.0, 0.0, 0.0, 0.0);

		var pixel_count = 0.;

		for (var horizontal:f32 = blur_radius/-2.; horizontal <= blur_radius/2.; horizontal = horizontal + 1.) {

			for (var vertical:f32 = blur_radius/-2.; vertical <= blur_radius/2.; vertical = vertical + 1.) {

				let pixel_position = vec2f(npos.x + (horizontal/res.x), npos.y + (vertical/res.y));

				let new_color = lastframe(pixel_position);

				if (pixel_position.x >= 0 && pixel_position.y >= 0) {

					average_color = average_color + new_color;
					pixel_count += 1.;

				}

			}

		}

		if (pixel_count > 0) {

			output = average_color / pixel_count;

		}


		if (phase == 13) {

			if (distance(npos.xy, mouse.xy) < draw_radius) {

				output = vec4f(fract(time), 1.-fract(time), (mouse.x+mouse.y)/2., 1.0);

			}

		}

	}


  return output;
}