
function download(filename, text) {
	let element = document.createElement('a')
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
	element.setAttribute('download', filename)
	
	element.style.display = 'none'
	document.body.appendChild(element)
	
	element.click()
	
	document.body.removeChild(element)
}

function rotateVectorAroundZAxis(x, y, theta) {
	let temp_x = x * Math.cos(theta) - y * Math.sin(theta)
	let temp_y = x * Math.sin(theta) + y * Math.cos(theta)
	return [temp_x, temp_y]
}

function renderSpiralTopView(point_array, number_of_slices, start_radius, end_radius) {
	let canvas = document.getElementById("spiral_render_top")
	let context = canvas.getContext("2d")
	context.clearRect(0, 0, canvas.width, canvas.height)
	context.strokeStyle = "#FFFFFF";
	let radius = start_radius
	if (end_radius > radius) {
		radius = end_radius
	}
	radius *= 1.05
	let resize_factor = (canvas.width) / radius / 2
	let grid_start = radius*resize_factor
	while (grid_start > 0) {
		grid_start -= 128*resize_factor
	}
	context.beginPath()
	for (i=grid_start; i<2*radius*resize_factor; i+=128*resize_factor) {
		context.moveTo(i, 0)
		context.lineTo(i, 2*radius*resize_factor)
		context.moveTo(0, i)
		context.lineTo(2*radius*resize_factor, i)
	}
	context.closePath()
	context.stroke()
	context.strokeStyle = "#FF0000";
	context.beginPath()
	context.moveTo(radius*resize_factor, 0)
	context.lineTo(radius*resize_factor, 2*radius*resize_factor)
	context.moveTo(0, radius*resize_factor)
	context.lineTo(2*radius*resize_factor, radius*resize_factor)
	context.closePath()
	context.stroke()
	context.strokeStyle = "#000000";
	context.beginPath()
	context.moveTo((point_array[0][0] + radius) * resize_factor, -(point_array[0][1] - radius) * resize_factor)
	for (i=0; i < number_of_slices; i++) {
		context.lineTo((point_array[i+1][0] + radius) * resize_factor, -(point_array[i+1][1] - radius) * resize_factor)
	}
	for (i=number_of_slices; i >= 0; i--) {
		context.lineTo((point_array[i][2] + radius) * resize_factor, -(point_array[i][3] - radius) * resize_factor)
	}
	context.closePath()
	context.fillStyle = '#FFFF00'
	context.fill()
	for (i=1; i < number_of_slices; i++) {
		context.moveTo((point_array[i][0] + radius) * resize_factor, -(point_array[i][1] - radius) * resize_factor)
		context.lineTo((point_array[i][2] + radius) * resize_factor, -(point_array[i][3] - radius) * resize_factor)
	}
	context.stroke()
}

function renderSpiralSideView(point_array, number_of_slices, start_radius, end_radius, current_height, height_step, height, slice_height, top_side, bottom_side, inner_side, outer_side) {
	let face_array = []
	
	for (i=0; i < number_of_slices; i++) {
		if (top_side) {
			let extra_distance = 0.0001
			if (height_step > 0) {
				extra_distance *= -1
			}
			if (point_array[i][0] < 0) {
				extra_distance *= -1
			}
			face_array[i] = {
				distance: point_array[i][1] + point_array[i][3] + point_array[i+1][1] + point_array[i+1][3] + extra_distance,
				facing_away: false,
				0: {x: point_array[i][0], z: current_height + height_step * i},
				1: {x: point_array[i][2], z: current_height + height_step * i},
				2: {x: point_array[i+1][2], z: current_height + height_step * (i+1)},
				3: {x: point_array[i+1][0], z: current_height + height_step * (i+1)}
			}
			if (point_array[i][1] > point_array[i+1][1]) {
				face_array[i].facing_away = true
			}
			if (face_array[i][3].z < face_array[i][0].z) {
				if (face_array[i].facing_away) {
					face_array[i].facing_away = false
				} else {
					face_array[i].facing_away = true
				}
			}
		}
		if (bottom_side) {
			face_array[i+number_of_slices] = {
				distance: point_array[i][1] + point_array[i][3] + point_array[i+1][1] + point_array[i+1][3],
				facing_away: false,
				0: {x: point_array[i][0], z: current_height + height_step * i - slice_height},
				1: {x: point_array[i][2], z: current_height + height_step * i - slice_height},
				2: {x: point_array[i+1][2], z: current_height + height_step * (i+1) - slice_height},
				3: {x: point_array[i+1][0], z: current_height + height_step * (i+1) - slice_height}
			}
			if (point_array[i][1] < point_array[i+1][1]) {
				face_array[i+number_of_slices].facing_away = true
			}
			if (face_array[i+number_of_slices][3].z < face_array[i+number_of_slices][0].z) {
				if (face_array[i+number_of_slices].facing_away) {
					face_array[i+number_of_slices].facing_away = false
				} else {
					face_array[i+number_of_slices].facing_away = true
				}
			}
		}
		if (inner_side) {
			face_array[i+number_of_slices*2] = {
				distance: point_array[i][1] + point_array[i][1] + point_array[i+1][1] + point_array[i+1][1],
				facing_away: false,
				0: {x: point_array[i][0], z: current_height + height_step * i},
				1: {x: point_array[i][0], z: current_height + height_step * i - slice_height},
				2: {x: point_array[i+1][0], z: current_height + height_step * (i+1) - slice_height},
				3: {x: point_array[i+1][0], z: current_height + height_step * (i+1)}
			}
			if (face_array[i+number_of_slices*2][3].x > face_array[i+number_of_slices*2][0].x) {
				face_array[i+number_of_slices*2].facing_away = true
			}
		}
		if (outer_side) {
			face_array[i+number_of_slices*3] = {
				distance: point_array[i][3] + point_array[i][3] + point_array[i+1][3] + point_array[i+1][3],
				facing_away: false,
				0: {x: point_array[i][2], z: current_height + height_step * i},
				1: {x: point_array[i][2], z: current_height + height_step * i - slice_height},
				2: {x: point_array[i+1][2], z: current_height + height_step * (i+1) - slice_height},
				3: {x: point_array[i+1][2], z: current_height + height_step * (i+1)}
			}
			if (face_array[i+number_of_slices*3][3].x < face_array[i+number_of_slices*3][0].x) {
				face_array[i+number_of_slices*3].facing_away = true
			}
		}
	}
	face_array.sort(function(a, b){return b.distance - a.distance})
	
	let canvas = document.getElementById("spiral_render_side")
	let context = canvas.getContext("2d")
	context.clearRect(0, 0, canvas.width, canvas.height)
	let radius = start_radius
	if (end_radius > radius) {
		radius = end_radius
	}
	if ((Math.abs(height_step * number_of_slices) + slice_height) > (radius*2)) {
		radius = Math.abs(height_step * number_of_slices)/2 + slice_height
	}
	radius *= 1.05
	let resize_factor = (canvas.width) / radius / 2
	context.strokeStyle = "#FFFFFF";
	let grid_start = radius*resize_factor
	while (grid_start > 0) {
		grid_start -= 128*resize_factor
	}
	context.beginPath()
	for (i=grid_start; i<2*radius*resize_factor; i+=128*resize_factor) {
		context.moveTo(i, 0)
		context.lineTo(i, 2*radius*resize_factor)
		context.moveTo(0, i - height/2*resize_factor)
		context.lineTo(2*radius*resize_factor, i - height/2*resize_factor)
	}
	context.closePath()
	context.stroke()
	context.strokeStyle = "#FF0000";
	context.beginPath()
	context.moveTo(radius*resize_factor, 0)
	context.lineTo(radius*resize_factor, 2*radius*resize_factor)
	context.moveTo(0, radius*resize_factor + height/2*resize_factor)
	context.lineTo(2*radius*resize_factor, radius*resize_factor + height/2*resize_factor)
	context.closePath()
	context.stroke()
	context.strokeStyle = "#000000";
	for (let key in face_array) {
		context.beginPath()
		context.moveTo((face_array[key][0].x + radius) * resize_factor, -(face_array[key][0].z - radius - height/2) * resize_factor)
		context.lineTo((face_array[key][1].x + radius) * resize_factor, -(face_array[key][1].z - radius - height/2) * resize_factor)
		context.lineTo((face_array[key][2].x + radius) * resize_factor, -(face_array[key][2].z - radius - height/2) * resize_factor)
		context.lineTo((face_array[key][3].x + radius) * resize_factor, -(face_array[key][3].z - radius - height/2) * resize_factor)
		context.closePath()
		context.fillStyle = '#FFFF00'
		if (face_array[key].facing_away) {
			context.fillStyle = '#FF0000'
		}
		context.fill()
		context.stroke()
	}
}

function generate_spiral() {
	start_radius = Number(document.getElementById("start_radius").value)
	end_radius = Number(document.getElementById("end_radius").value)
	height = Number(document.getElementById("height").value)
	width = Number(document.getElementById("width").value)
	angle = Number(document.getElementById("angle").value)
	number_of_slices = Number(document.getElementById("number_of_slices").value)
	slice_height = Number(document.getElementById("slice_height").value)
	top_side = document.getElementById("top_side").checked
	bottom_side = document.getElementById("bottom_side").checked
	inner_side = document.getElementById("inner_side").checked
	outer_side = document.getElementById("outer_side").checked
	
	let is_face_generated = {
		0: false, /* top */
		1: false, /* bottom */
		2: false, /* left */
		3: false, /* right */
		4: false, /* back */
		5: false /* front */
	}
	
	if (top_side) {
		is_face_generated[0] = true
	}
	if (bottom_side) {
		is_face_generated[1] = true
	}
	if (inner_side) {
		is_face_generated[5] = true
	}
	if (outer_side) {
		is_face_generated[4] = true
	}
	if (!is_face_generated[0] && !is_face_generated[1] && !is_face_generated[4] && !is_face_generated[5]) {
		document.getElementById("top_side").checked = true
		is_face_generated[0] = true
	}
	
	if (width < 2) {
		width = 2
	}
	if (start_radius - width < 2) {
		start_radius = 2 + width
	}
	if (end_radius - width < 2) {
		end_radius = 2 + width
	}
	if (number_of_slices < 1) {
		number_of_slices = 1
	}
	if (slice_height < 2) {
		slice_height = 2
	}
	if (Math.abs(angle) < 2) {
		angle = 2
	}
	
	document.getElementById("start_radius").value = start_radius
	document.getElementById("end_radius").value = end_radius
	document.getElementById("height").value = height
	document.getElementById("width").value = width
	document.getElementById("angle").value = angle
	document.getElementById("number_of_slices").value = number_of_slices
	document.getElementById("slice_height").value = slice_height
	
	angle = angle / 180 * Math.PI
	
	let current_height = 0
	let height_step = height / number_of_slices
	let quarter_height_step = height_step / 4
	let starting_vector1 = {}
	starting_vector1[0] = start_radius - width
	starting_vector1[1] = 0
	let starting_vector2 = {}
	starting_vector2[0] = start_radius
	starting_vector2[1] = 0
	
	let end_resize_factor = (end_radius - width) / (start_radius - width)
	let step_vector1 = {}
	step_vector1[0] = starting_vector1[0] * (end_resize_factor - 1) / number_of_slices
	step_vector1[1] = starting_vector1[1] * (end_resize_factor - 1) / number_of_slices
	end_resize_factor = end_radius / start_radius
	let step_vector2 = {}
	step_vector2[0] = starting_vector2[0] * (end_resize_factor - 1) / number_of_slices
	step_vector2[1] = starting_vector2[1] * (end_resize_factor - 1) / number_of_slices
	
	if (angle < 0) {
		current_height = height
		height_step = - height_step
		quarter_height_step = - quarter_height_step
		starting_vector1 = rotateVectorAroundZAxis(starting_vector1[0], starting_vector1[1], angle)
		starting_vector2 = rotateVectorAroundZAxis(starting_vector2[0], starting_vector2[1], angle)
		angle = - angle
	}
	
	let point_array = {}
	for (i=0; i <= number_of_slices; i++) {
		let current_angle = angle / number_of_slices * i
		let temp_step1 = rotateVectorAroundZAxis(step_vector1[0], step_vector1[1], current_angle)
		let temp_step2 = rotateVectorAroundZAxis(step_vector2[0], step_vector2[1], current_angle)
		let temp_coords1 = rotateVectorAroundZAxis(starting_vector1[0], starting_vector1[1], current_angle)
		let temp_coords2 = rotateVectorAroundZAxis(starting_vector2[0], starting_vector2[1], current_angle)
		point_array[i] = {}
		point_array[i][0] = temp_coords1[0] + temp_step1[0] * i
		point_array[i][1] = temp_coords1[1] + temp_step1[1] * i
		point_array[i][2] = temp_coords2[0] + temp_step2[0] * i
		point_array[i][3] = temp_coords2[1] + temp_step2[1] * i
	}
	
	renderSpiralTopView(point_array, number_of_slices, start_radius, end_radius)
	renderSpiralSideView(point_array, number_of_slices, start_radius, end_radius, current_height, height_step, height, slice_height, top_side, bottom_side, inner_side, outer_side)
	
	return {0: is_face_generated, 1: point_array, 2: start_radius, 3: end_radius, 4: height, 5: width, 
	6: angle, 7: number_of_slices, 8: slice_height, 9: top_side, 10: bottom_side, 
	11: inner_side, 12: outer_side, 13: current_height, 14: height_step, 15: quarter_height_step}
}

function generate_vmf() {
	let output_table = generate_spiral()
	let is_face_generated = output_table[0]
	let point_array = output_table[1]
	let start_radius = output_table[2]
	let end_radius = output_table[3]
	let height = output_table[4]
	let width = output_table[5]
	let angle = output_table[6]
	let number_of_slices = output_table[7]
	let slice_height = output_table[8]
	let top_side = output_table[9]
	let bottom_side = output_table[10]
	let inner_side = output_table[11]
	let outer_side = output_table[12]
	let current_height = output_table[13]
	let height_step = output_table[14]
	let quarter_height_step = output_table[15]
	
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
	
	for (let i = 0; i < number_of_slices; i++) {
		current_id += 1
		vmf_structure_array['world']['solid' + i] = {
			id: current_id
		}
		
		let vertex_array = {
			0: {0: point_array[i+1][0], 1: point_array[i+1][1], 2: (-slice_height)},
			1: {0: point_array[i][0], 1: point_array[i][1], 2: (-slice_height)},
			2: {0: point_array[i][2], 1: point_array[i][3], 2: (-slice_height)},
			3: {0: point_array[i+1][2], 1: point_array[i+1][3], 2: (-slice_height)},
			4: {0: point_array[i+1][0], 1: point_array[i+1][1], 2: 0},
			5: {0: point_array[i][0], 1: point_array[i][1], 2: 0},
			6: {0: point_array[i][2], 1: point_array[i][3], 2: 0},
			7: {0: point_array[i+1][2], 1: point_array[i+1][3], 2: 0}
		}
		
		let plane_array = {
			0: {0: vertex_array[7], 1: vertex_array[6], 2: vertex_array[5]}, /* top */
			1: {0: vertex_array[0], 1: vertex_array[1], 2: vertex_array[2]}, /* bottom */
			2: {0: vertex_array[7], 1: vertex_array[4], 2: vertex_array[0]}, /* left */
			3: {0: vertex_array[2], 1: vertex_array[1], 2: vertex_array[5]}, /* right */
			4: {0: vertex_array[6], 1: vertex_array[7], 2: vertex_array[3]}, /* back */
			5: {0: vertex_array[1], 1: vertex_array[0], 2: vertex_array[4]} /* front */
		}
		
		let uaxis_array = {}
		uaxis_array[0] = '[1 0 0 0] 0.25' /* top */
		uaxis_array[1] = '[1 0 0 0] 0.25' /* bottom */
		
		for (let j=2; j < 6; j++) {
			let uaxis1 = plane_array[j][0][0] - plane_array[j][1][0]
			let uaxis2 = plane_array[j][0][1] - plane_array[j][1][1]
			let uaxis_length = Math.sqrt(uaxis1 * uaxis1 + uaxis2 * uaxis2)
			uaxis1 = uaxis1 / uaxis_length
			uaxis2 = uaxis2 / uaxis_length
			uaxis_array[j] = '[' + uaxis1 + ' ' + uaxis2 + ' 0 0] 0.25'
		}
		
		let vaxis_array = {
			0: '[0 -1 0 0] 0.25', /* top */
			1: '[0 -1 0 0] 0.25', /* bottom */
			2: '[0 0 -1 0] 0.25', /* left */
			3: '[0 0 -1 0] 0.25', /* right */
			4: '[0 0 -1 0] 0.25', /* back */
			5: '[0 0 -1 0] 0.25' /* front */
		}
		
		for (let j=0; j < 6; j++) {
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
				for (let j=0; j < 5; j++) {
					distance_array[j] = (current_height+quarter_height_step*4) + ' ' + (current_height+quarter_height_step*3) + ' ' + (current_height+quarter_height_step*2) + ' ' + (current_height+quarter_height_step) + ' ' + current_height
				}
				
				let start_position = ''
				if (j == 0) {
					start_position += '[' + point_array[i+1][0] + ' ' + point_array[i+1][1] + ' 0]'
				} else if (j == 4) {
					start_position += '[' + point_array[i+1][2] + ' ' + point_array[i+1][3] + ' 0]'
				} else if (j == 1) {
					start_position += '[' + point_array[i+1][2] + ' ' + point_array[i+1][3] + ' 0]'
				} else {
					start_position += '[' + point_array[i+1][2] + ' ' + point_array[i+1][3] + ' ' + (-slice_height) + ']'
				}
				
				vmf_structure_array['world']['solid' + i]['side' + j]['dispinfo'] = {
					power: '2',
					startposition: start_position,
					flags: '0',
					elevation: '0',
					subdiv: '0',
					normals: {
						row0: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row1: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row2: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row3: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row4: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1'
					},
					distances: {
						row0: distance_array[0],
						row1: distance_array[1],
						row2: distance_array[2],
						row3: distance_array[3],
						row4: distance_array[4]
					},
					offsets: {
						row0: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0',
						row1: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0',
						row2: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0',
						row3: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0',
						row4: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'
					},
					offset_normals: {
						row0: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row1: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row2: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row3: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1',
						row4: '0 0 1 0 0 1 0 0 1 0 0 1 0 0 1'
					},
					alphas: {
						row0: '0 0 0 0 0',
						row1: '0 0 0 0 0',
						row2: '0 0 0 0 0',
						row3: '0 0 0 0 0',
						row4: '0 0 0 0 0'
					},
					triangle_tags: {
						row0: '0 0 0 0 0 0 0 0',
						row1: '0 0 0 0 0 0 0 0',
						row2: '0 0 0 0 0 0 0 0',
						row3: '0 0 0 0 0 0 0 0'
					},
					allowed_verts: {
						'10': '-1 -1 -1 -1 -1 -1 -1 -1 -1 -1'
					}
				}
				vmf_structure_array['world']['solid' + i]['editor'] = {
					color: '220 220 220',
					groupid: '0',
					visgroupshown: '1',
					visgroupautoshown: '1'
				}
			}
		}
		current_height += height_step
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
	download('smooth_spiral.vmf', vmf_string)
}


