import QRCode from 'qrcode';

const SVG_NS = 'http://www.w3.org/2000/svg';
const QR_WIDTH = 256;

const input = document.getElementById('qr-content');
const logoInput = document.getElementById('qr-logo');
const removeLogo = document.getElementById('qr-remove-logo');
const logoSize = document.getElementById('qr-logo-size');
const logoSizeValue = document.getElementById('qr-logo-size-value');
const logoBgShapeInput = document.getElementById('qr-logo-bg-shape');
const borderWidth = document.getElementById('qr-border-width');
const borderWidthValue = document.getElementById('qr-border-width-value');
const borderRadius = document.getElementById('qr-border-radius');
const borderRadiusValue = document.getElementById('qr-border-radius-value');
const output = document.getElementById('qr-code');
const download = document.getElementById('qr-download');

let logo = null;
let logoBgShape = null;

async function generateQR(txt) {
	return QRCode.toString(txt, {
		type: 'svg',
		color: {dark: '#000', light: '#fff0'},
		errorCorrectionLevel: 'H',
	});
}

function svgElement(name, attrs) {
	let element = document.createElementNS(SVG_NS, name);
	for (let [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
	return element;
}

function readFile(file) {
	return new Promise((resolve, reject) => {
		let fr = new FileReader();
		fr.onload = () => resolve(fr.result);
		fr.onerror = () => reject(fr.error);
		fr.readAsDataURL(file);
	});
}

function aspectRatio(src){
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.onload = () => {
			let r = img.naturalWidth / img.naturalHeight;
			resolve(Number.isFinite(r) && r > 0 ? r : 1);
		};
		img.onerror = reject;
		img.src = src;
	});
}

async function loadLogo(file) {
	const href = await readFile(file);
	const ratio = await aspectRatio(href);
	return {href, ratio};
}

function addLogo(svg, logo, scale) {
	let size = svg.viewBox.baseVal.width;
	let longest = size * scale;
	let width = logo.ratio >= 1 ? longest : longest * logo.ratio;
	let height = logo.ratio >= 1 ? longest / logo.ratio : longest;
	let biggest = Math.max(width, height);
	let x = (size - width)/2;
	let y = (size - height)/2;
	let padding = 0.5;
	let bgCornerRadius = 2;

	let shape = (() => {
		switch(logoBgShape) {
			case 'none':
				return null;
			case 'circle':
				return svgElement('circle', {
					cx: x+width/2,
					cy: y+height/2,
					r: biggest/2 + padding*2,
					fill: '#fff',
				});
			case 'rounded-square':
				return svgElement('rect', {
					x: x-padding,
					y: y-padding,
					rx: bgCornerRadius,
					ry: bgCornerRadius,
					width: width + padding*2,
					height: height + padding*2,
					fill: '#fff',
				});
			case 'rect':
			default:
				return svgElement('rect', {
					x: x-padding,
					y: y-padding,
					width: width + padding*2,
					height: height + padding*2,
					fill: '#fff',
				});
		}
	})();

	svg.append(
		shape,
		svgElement('image', {
			x: x,
			y: y,
			width: width,
			height: height,
			href: logo.href,
			preserveAspectRatio: 'xMidYMid meet',
		}),
	);
}

function addBorder(svg, size, width, radius) {
	svg.setAttribute('viewBox', `${-width} ${-width} ${size + width*2} ${size + width*2}`);
	svg.prepend(
		svgElement('rect', {
			x: -width/2,
			y: -width/2,
			width: size+width,
			height: size+width,
			rx: radius,
			fill: '#fff',
			stroke: '#000',
			'stroke-width': width,
		}),
	);
}

async function generate(){
	if (!input.value) {
		output.replaceChildren();
		output.innerText = "Nothing to generate"
		return 
	}
	try {
		output.innerHTML = await generateQR(input.value);
		let svg = output.querySelector('svg');
		let size = svg.viewBox.baseVal.width;
		if(logo != null) {
			addLogo(svg, logo, logoSize.valueAsNumber / 100);
		}
		addBorder(svg, size, borderWidth.valueAsNumber, borderRadius.valueAsNumber);

		let total = svg.viewBox.baseVal.width * QR_WIDTH / size;
		svg.setAttribute('width', total);
		svg.setAttribute('height', total);

		let file = new XMLSerializer().serializeToString(svg);
		download.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(file);
		download.download = input.value;
		console.log(output);
	} catch (err) {
		console.error(err);
	}
}

input.addEventListener('input', generate);
logoSize.addEventListener('input', async (event) => {
	logoSizeValue.textContent = event.target.value;
	generate();
});
removeLogo.addEventListener('click', async () => {
	logo = null;
	logoInput.value = null;
	generate();
});
logoInput.addEventListener('change', async () => {
	let file = logoInput.files[0];
	try {
		logo = file ? await loadLogo(file) : null;
	} catch (err) {
		console.error(err);
	}
	generate();
});
logoBgShapeInput.addEventListener('change', async(event) => {
	logoBgShape = event.target.value;
	console.log(event, logoBgShape)
	generate();
});
borderWidth.addEventListener('input', async (event) => {
	borderWidthValue.textContent = event.target.value;
	generate();
});
borderRadius.addEventListener('input', async (event) => {
	borderRadiusValue.textContent = event.target.value;
	generate();
});
