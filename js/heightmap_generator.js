
function download(filename, text) {
	let element = document.createElement('a')
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
	element.setAttribute('download', filename)
	
	element.style.display = 'none'
	document.body.appendChild(element)
	
	element.click()
	
	document.body.removeChild(element)
}

let is_image_loaded = false

let loadFile = function(event) {
	let image = document.getElementById('heightmap_buffer')
	image.src = URL.createObjectURL(event.target.files[0])
	is_image_loaded = true
	setTimeout(() => {generateHeightmap();}, 100)
}

function generateHeightmap() {
	if (!is_image_loaded) {
		return 0;
	}
	let size_x = Number(document.getElementById("size_x").value)
	let size_y = Number(document.getElementById("size_y").value)
	let size_z = Number(document.getElementById("size_z").value)
	let num_of_displacements_x = Number(document.getElementById("num_of_displacements_x").value)
	let num_of_displacements_y = Number(document.getElementById("num_of_displacements_y").value)
	let disp_power = Number(document.getElementById("disp_power").value)
	let alpha_cutoff = Number(document.getElementById("alpha_cutoff").value)
	
	let image = document.getElementById('heightmap_buffer')
	let canvas = document.getElementById("heightmap_render")
	let context = canvas.getContext("2d")
	context.drawImage(image, 0, 0, 1000, 1000)
	
	let height_array = []
	for (let x=0; x<1000; x++) {
		height_array[x] = []
		for (let y=0; y<1000; y++) {
			height_array[x][y] = 0
		}
	}
	
	let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
	let data = imageData.data
	{
		let x=0
		let y=0
		for (var i = 0; i < data.length; i += 4) {
			let color_sum = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3 + 0.5)
			data[i]     = color_sum
			data[i + 1] = color_sum
			data[i + 2] = color_sum
			
			height_array[x][y] = color_sum
			x++
			if (x>999) {
				y++
				x=0
			}
		}
	}
	
    context.putImageData(imageData, 0, 0)
	
	canvas = document.getElementById("alpha_render")
	context = canvas.getContext("2d")
	context.drawImage(image, 0, 0, 1000, 1000)
	imageData = context.getImageData(0, 0, canvas.width, canvas.height)
	data = imageData.data
	{
		let x=0
		let y=0
		for (var i = 0; i < data.length; i += 4) {
			let color_sum = 0
			if (height_array[x][y] >= alpha_cutoff) {
				color_sum = 255
			}
			data[i]     = color_sum
			data[i + 1] = color_sum
			data[i + 2] = color_sum
			
			x++
			if (x>999) {
				y++
				x=0
			}
		}
	}
	context.putImageData(imageData, 0, 0)
	
	let power_multiplier = Math.pow(2, disp_power)
	
	let resize_factor_x = 1000/(num_of_displacements_x*power_multiplier+1)
	let resize_factor_y = 1000/(num_of_displacements_y*power_multiplier+1)
	let resize_factor_z = size_z/255
	
	let resized_height_array = []
	let alpha_array = []
	
	for (let x=0; x<=num_of_displacements_x*power_multiplier; x++) {
		resized_height_array[x] = []
		alpha_array[x] = []
		for (let y=0; y<=num_of_displacements_y*power_multiplier; y++) {
			let temp_x = Math.floor(x*resize_factor_x+0.5)
			let temp_y = Math.floor(y*resize_factor_y+0.5)
			resized_height_array[x][y] = height_array[temp_x][temp_y] * resize_factor_z
			if (height_array[temp_x][temp_y] >= alpha_cutoff) {
				alpha_array[x][y] = 255
			} else {
				alpha_array[x][y] = 0
			}
			
		}
	}
	return {0: resized_height_array, 1: size_x, 2: size_y, 3: size_z, 4: num_of_displacements_x, 5: num_of_displacements_y, 6: disp_power, 7: alpha_array}
}

function generateVmf() {
	if (!is_image_loaded) {
		return 0;
	}
	let output_table = generateHeightmap()
	let resized_height_array = output_table[0]
	let size_x = output_table[1]
	let size_y = output_table[2]
	let size_z = output_table[3]
	let num_of_displacements_x = output_table[4]
	let num_of_displacements_y = output_table[5]
	let disp_power = output_table[6]
	let power_multiplier = Math.pow(2, disp_power)
	let alpha_array = output_table[7]
	
	let is_face_generated = {
		0: true,  /* top */
		1: false, /* bottom */
		2: false, /* left */
		3: false, /* right */
		4: false, /* back */
		5: false  /* front */
	}
	
	let current_id = 1
	const vmf_structure_array = {
		versioninfo: {
			editorversion: '400',
			editorbuild: '8862',
			mapversion: '0',
			formatversion: '100',
			prefab: '1'
		},
		world: {
			id: current_id,
			mapversion: '0',
			classname: 'worldspawn',
			detailmaterial: 'detail/detailsprites_2fort',
			detailvbsp: 'detail_2fort.vbsp',
			maxpropscreenwidth: '-1',
			skyname: 'sky_tf2_04'
		}
	}
	
	let resize_factor_x = size_x / num_of_displacements_x
	let resize_factor_y = size_y / num_of_displacements_y
	let i=-1
	
	for (let x = 0; x < num_of_displacements_x; x++) {
		for (let y = 0; y < num_of_displacements_y; y++) {
			i++
			current_id += 1
			vmf_structure_array['world']['solid' + i] = {
				id: current_id
			}
			let x2 = x - (num_of_displacements_x / 2)
			let y2 = y - (num_of_displacements_y / 2)
			let vertex_array = {
				0: {0: y2 * resize_factor_y, 1: (x2+1) * resize_factor_x, 2: -16},
				1: {0: y2 * resize_factor_y, 1: x2 * resize_factor_x, 2: -16},
				2: {0: (y2+1) * resize_factor_y, 1: x2 * resize_factor_x, 2: -16},
				3: {0:(y2+1) * resize_factor_y, 1: (x2+1) * resize_factor_x, 2: -16},
				4: {0: y2 * resize_factor_y, 1: (x2+1) * resize_factor_x, 2: 0},
				5: {0: y2 * resize_factor_y, 1: x2 * resize_factor_x, 2: 0},
				6: {0: (y2+1) * resize_factor_y, 1: x2 * resize_factor_x, 2: 0},
				7: {0: (y2+1) * resize_factor_y, 1: (x2+1) * resize_factor_x, 2: 0}
			}
			
			let plane_array = {
				0: {0: vertex_array[7], 1: vertex_array[6], 2: vertex_array[5]}, /* top */
				1: {0: vertex_array[0], 1: vertex_array[1], 2: vertex_array[2]}, /* bottom */
				2: {0: vertex_array[7], 1: vertex_array[4], 2: vertex_array[0]}, /* left */
				3: {0: vertex_array[2], 1: vertex_array[1], 2: vertex_array[5]}, /* right */
				4: {0: vertex_array[6], 1: vertex_array[7], 2: vertex_array[3]}, /* back */
				5: {0: vertex_array[1], 1: vertex_array[0], 2: vertex_array[4]} /* front */
			}
			
			let uaxis_array = {
				0: '[1 0 0 0] 0.25',
				1: '[1 0 0 0] 0.25',
				2: '[1 0 0 0] 0.25',
				3: '[1 0 0 0] 0.25',
				4: '[0 1 0 0] 0.25',
				5: '[0 1 0 0] 0.25'
			}
			
			let vaxis_array = {
				0: '[0 -1 0 0] 0.25', /* top */
				1: '[0 -1 0 0] 0.25', /* bottom */
				2: '[0 0 -1 0] 0.25', /* left */
				3: '[0 0 -1 0] 0.25', /* right */
				4: '[0 0 -1 0] 0.25', /* back */
				5: '[0 0 -1 0] 0.25' /* front */
			}
			
			for (let j = 0; j < 6; j++) {
				current_id += 1
				vmf_structure_array['world']['solid' + i]['side' + j] = {
					id: current_id,
					plane: '(' + plane_array[j][0][0] + ' ' + plane_array[j][0][1] + ' ' + plane_array[j][0][2] + ') (' + plane_array[j][1][0] + ' ' + plane_array[j][1][1] + ' ' + plane_array[j][1][2] + ') (' + plane_array[j][2][0] + ' ' + plane_array[j][2][1] + ' ' + plane_array[j][2][2] + ')',
					material: 'TOOLS/TOOLSNODRAW',
					uaxis: uaxis_array[j],
					vaxis: vaxis_array[j],
					rotation: '0',
					lightmapscale: '16',
					smoothing_groups: '0'
				}
				
				if (is_face_generated[j]) {
					let distance_array = {}
					let alpha_string_array = {}
					let normal = ''
					let offset = ''
					let alpha = ''
					let triangle = ''
					for (let k = 0; k < power_multiplier; k++) {
						triangle += '0 0 '
					}
					for (let k = 0; k <= power_multiplier; k++) {
						normal += '0 0 1 '
						offset += '0 0 0 '
						distance_array[k] = ''
						alpha_string_array[k] = ''
						for (let m = 0; m <= power_multiplier; m++) {
							distance_array[k] += (resized_height_array[x * power_multiplier + power_multiplier - m][y * power_multiplier + k]) + ' '
							alpha_string_array[k] += (alpha_array[x * power_multiplier + power_multiplier - m][y * power_multiplier + k]) + ' '
						}
					}
					
					let start_position = '[' + vertex_array[4][0] + ' ' + vertex_array[4][1] + ' 0]'
					
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo'] = {
						power: disp_power,
						startposition: start_position,
						flags: '0',
						elevation: '0',
						subdiv: '0'
					}
					
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['normals'] = {}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['distances'] = {}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['offsets'] = {}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['offset_normals'] = {}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['alphas'] = {}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['triangle_tags'] = {}
					
					for (let k = 0; k <= power_multiplier; k++) {
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['normals']['row' + k] = normal
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['distances']['row' + k] = distance_array[k]
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['offsets']['row' + k] = offset
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['offset_normals']['row' + k] = normal
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['alphas']['row' + k] = alpha_string_array[k]
					}
					for (let k = 0; k < power_multiplier; k++) {
						vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['triangle_tags']['row' + k] = triangle
					}
					vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo']['allowed_verts'] = {
						'10': '-1 -1 -1 -1 -1 -1 -1 -1 -1 -1'
					}
					vmf_structure_array['world']['solid' + i]['editor'] = {
						color: '220 220 220',
						groupid: '0',
						visgroupshown: '1',
						visgroupautoshown: '1'
					}
				}
			}
		}
	}
	
	vmf_structure_array['world']['group'] = {
		id: 0,
		editor: {
			color: '220 220 220',
			visgroupshown: '1',
			visgroupautoshown: '1'
		}
	}
	
	let vmf_string = ''
	function writeObjectToString(object, key_of_object, spacing) {
		if (key_of_object.substring(0, 5) == 'solid') {
			key_of_object = 'solid'
		} else if (key_of_object.substring(0, 4) == 'side') {
			key_of_object = 'side'
		}
		vmf_string += spacing + key_of_object + '\n'
		vmf_string += spacing + '{\n'
		spacing += '	'
		for (let key in object) {
			if (typeof object[key] === 'object') {
				writeObjectToString(object[key], key, spacing)
			} else {
				vmf_string += spacing + '\"' + key + '\" \"' + object[key] + '\"\n'
			}
		}
		spacing = spacing.slice(0, -1)
		vmf_string += spacing + '}\n'
	}
	
	for (let key in vmf_structure_array) {
		writeObjectToString(vmf_structure_array[key], key, '')
	}
	
	download('heightmap.vmf', vmf_string)
}
