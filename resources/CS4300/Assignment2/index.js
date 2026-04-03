import { default as gulls } from './gulls.js'
import {default as Mouse} from './helpers/mouse.js'
import {Pane} from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js'
import {default as Video} from './helpers/video.js'

const sg = await gulls.init()
const frag = await gulls.import('./frag.wgsl')
const shader = gulls.constants.vertex + frag

Mouse.init()
await Video.init()


const frame = sg.uniform(0)
const res = sg.uniform( [window.innerWidth, window.innerHeight] )
const mouse = sg.uniform(Mouse.values)

const enableVideo = sg.uniform(1.)

const vZ = sg.uniform(0.)
const enableVoronoi = sg.uniform(0.)

const cell_size = 0.1
const grid_width = 1.
const grid_height = 1.
const grid_depth = 5.
const grid_center = {x:0.55, y:0.55, z:2.5}

const drawGrid = sg.uniform(0.)

const debugPointSelector = sg.uniform(0.);

const automaticDepth = {enabled: false, speed: 0.1, current: 0., direction:1}

const pane = new Pane()
pane.addBinding(enableVideo, 'value', {options: {on:1., off:0.}, label:"Enable Video"})
pane.addBinding(vZ, 'value', {step:cell_size, label:"Z Depth", min:0., max:4.9})
pane.addBinding(enableVoronoi, 'value', {options: {on: 1., off:0.}, label:"Enable Voronoi"})
//pane.addBinding(debugPointSelector, 'value', {step:1., label:"Debug Voronoi", min:0., max:4999.})
pane.addBinding(automaticDepth, 'enabled', {options: {on: true, off: false}, label:"Automatic Depth"})
pane.addBinding(automaticDepth, 'speed', {min:0., max:10., label:"Automatic Depth Speed"})
pane.addBinding(drawGrid, 'value', {options: {on:1., off:0.}, label:"Draw Grid"})


function random_range(min, max) {
    const value = Math.random();
    const range = max-min;
    return (value*range) + min;
}

function random_point(min_x, max_x, min_y, max_y, min_z, max_z) {
    return {x: random_range(min_x, max_x), y: random_range(min_y, max_y), z: random_range(min_z, max_z)}
}

class grid_cell {
    min_x
    max_x
    min_y
    max_y
    min_z
    max_z
    center() {
        return {x: this.max_x-this.min_x, y: this.max_y-this.min_y, z: this.max_z-this.min_z}
    }
}

function generate_grid(width, height, depth, cell_size, center) {
    let grid = {}
    grid.width = width
    grid.height = height
    grid.depth = depth
    const x_cells = Math.floor(width/cell_size)
    const y_cells = Math.floor(height/cell_size)
    const z_cells = Math.floor(depth/cell_size)
    grid.x_cells = x_cells;
    grid.y_cells = y_cells;
    grid.z_cells = z_cells;
    grid.cell_count = Math.floor(x_cells*y_cells*z_cells)
    for (let x = 0; x < x_cells; x++) {
        let plane = {}
        for (let y = 0; y < y_cells; y++) {
            let row = {}
            for (let z = 0; z < z_cells; z++) {
                let new_cell = new grid_cell
                let x_progress = x/x_cells-0.5
                let y_progress = y/y_cells-0.5
                let z_progress = z/z_cells-0.5
                let x_disp = center.x + width*x_progress
                let y_disp = center.y + height*y_progress
                let z_disp = center.z + depth*z_progress
                let center_disp = cell_size/2
                new_cell.min_x = x_disp - center_disp
                new_cell.max_x = x_disp + center_disp
                new_cell.min_y = y_disp - center_disp
                new_cell.max_y = y_disp + center_disp
                new_cell.min_z = z_disp - center_disp
                new_cell.max_z = z_disp + center_disp
                row[z] = new_cell
            }
            plane[y] = row
        }
        grid[x] = plane
        console.log(plane)
    }
    return grid
}

function generate_points_in_grid(grid) {
    let points = new Float32Array(grid.cell_count*4)
    let index = 0
    for (let x = 0; x < grid.x_cells; x++) {
        for (let y = 0; y < grid.y_cells; y++) {
            for (let z = 0; z < grid.z_cells; z++) {
                let cell = grid[x][y][z]
                let new_point = random_point(cell.min_x, cell.max_x, cell.min_y, cell.max_y, cell.min_z, cell.max_z)
                points[index] = new_point.x
                index++
                points[index] = new_point.y
                index++
                points[index] = new_point.z
                index++
                points[index] = 0.
                index++
            }
        }
    }
    return points
}


const voronoi_grid = generate_grid(grid_width, grid_height, grid_depth, cell_size,grid_center)
console.log(voronoi_grid.width/cell_size)
console.log(voronoi_grid.height/cell_size)
console.log(voronoi_grid.depth/cell_size)
console.log(voronoi_grid.cell_count)
const points = generate_points_in_grid(voronoi_grid)
console.log(points)
const voronoi_points = sg.buffer(points)

const render = await sg.render({
    shader,
    data: [
        frame,
        res,
        mouse,
        vZ,
        enableVoronoi,
        voronoi_points,
        sg.uniform(grid_width),
        sg.uniform(grid_height),
        sg.uniform(grid_depth),
        sg.uniform(cell_size),
        drawGrid,
        enableVideo,
        sg.sampler(),
    sg.video(Video.element)],
    onframe() {
        frame.value++;
        mouse.value = Mouse.values;
        if (automaticDepth.enabled === true) {
            let additionFactor = automaticDepth.speed*automaticDepth.direction*0.001;
            if (automaticDepth.current + additionFactor >= grid_center.z + (grid_depth-cell_size)/2. || automaticDepth.current + additionFactor < grid_center.z - grid_depth/2.) {
                automaticDepth.direction *= -1;
            }
            else {
                automaticDepth.current += additionFactor;
            }
            vZ.value = automaticDepth.current;
        }
    }
})

sg.run( render )