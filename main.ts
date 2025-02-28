function init() {
	const canvas = document.querySelector("canvas");
	const ctx = canvas.getContext("2d");	
	image = new Image();
	image.src = "arrow.png";
	
	 // How much spacing there is between the vectors that hold the user input, from which others will be extrapolated
	const MEMORIZED_VECTORS_SPACING = 10;
	// Coords are divided by MEMORIZED_VECTORS_SPACING before going into here as keys
	const memorized_vectors = new Map();

	function mem_position(x, y) {
		console.assert(Number.isSafeInteger(x) && x >>> 16 === 0);
		console.assert(Number.isSafeInteger(y) && y >>> 16 === 0);
		return x << 16 | y;
	}
	
	function get_mem(x, y) {
		return memorized_vectors.get(mem_position(x, y)) ?? [0, 0];
	}
	
	function set_mem(x, y, a, b) {
		memorized_vectors.set(mem_position(x, y), [a, b]);
	}
	
	set_mem(4, 4, 2, 2);

	function hypotenuse(a, b) {
		return Math.sqrt(a * a + b * b);
	}
	
	// returns "vt" (value target)
	function linear_interpolate(p1, p2, pt, v1, v2) {
		if (p1 == p2) {
			console.assert(v1 == v2);
			return v1;
		}
		console.assert(p1 <= pt && pt <= p2);
		let alpha = (pt - p1) / (p2 - p1);
		return alpha * v2 + (1 - alpha) * v1;
	}

	function v(x, y) {
		// Find the memorized vectors in the 4 corners (or possibly less if directly on an integer, ie if ceiling = floor)
		// Transform them to memorized-space
		x = x / MEMORIZED_VECTORS_SPACING;
		y = y / MEMORIZED_VECTORS_SPACING;
		// Bilinear interpolation
		return [0, 1].map((dim) => {
			let bottom_v = linear_interpolate(Math.floor(x), Math.ceil(x), x, get_mem(Math.floor(x), Math.floor(y))[dim], get_mem(Math.ceil(x), Math.floor(y))[dim]);
			let top_v = linear_interpolate(Math.floor(x), Math.ceil(x), x, get_mem(Math.floor(x), Math.ceil(y))[dim], get_mem(Math.ceil(x), Math.ceil(y))[dim]);
			return linear_interpolate(Math.floor(y), Math.ceil(y), y, bottom_v, top_v);
		});
	}

	image.onload = async () => {
		const imag = await createImageBitmap(image, {resizeWidth: 30, resizeHeight: 100});
		
		function draw() {
			canvas.width = window.innerWidth; 
			canvas.height = window.innerHeight; 

			for (let i = 0; i < canvas.width; i += 30) {
				for (let j = 0; j < canvas.height; j += 30) {
					let vector = v(i, j);
					let a = Math.atan2(vector[1], vector[0]) + Math.PI / 2; // + PI/2 to rotate the image so the arrow points the right way
					let m = hypotenuse(vector[0], vector[1]);
					ctx.setTransform(1, 0, 0, 1, i, j); // Offset to the maasurment point
					ctx.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0);
					ctx.transform(1, 0, 0, m, 0, 0); // Stretch the arrow in accordance with the field magnitude at that point
					ctx.transform(1, 0, 0, 1, -15, 0); // Put the base of the arrow at the origin
					ctx.drawImage(imag, 0, 0);
				}
			}
		}
		
		window.addEventListener('resize', () => window.requestAnimationFrame(draw), false);
		
		canvas.addEventListener('pointermove', (event) => {
			if (event.pressure > 0.0) {
				let size = 10;
				mem_x = Math.floor(event.x / MEMORIZED_VECTORS_SPACING);
				mem_y = Math.floor(event.y / MEMORIZED_VECTORS_SPACING);
				for (i = mem_x - size; i < mem_x + size; i ++) {
					for (j = mem_y - size; j < mem_y + size; j ++) {
						let prev = get_mem(i, j);
						const coeff = 0.0005 * Math.max(0.0, size - hypotenuse(i - mem_x, j - mem_y));
						set_mem(i, j, prev[0] + event.movementX * coeff, prev[1] + event.movementY * coeff);
					}
				}
			}
			window.requestAnimationFrame(draw);
		})
		
		draw();
	};
	
};



document.addEventListener('DOMContentLoaded', init);
