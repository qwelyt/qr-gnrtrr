import QRCode from 'qrcode';

const input = document.getElementById('qr-content');
const output = document.getElementById('qr-code');
const download = document.getElementById('qr-download');


async function generateQR(txt) {
	return QRCode.toString(txt, {
		type: 'svg',
		width: 256,
		color: {dark: '#000', light: '#fff'},
		errorCorrectionLevel: 'H',
	});
}

input.addEventListener('input', async () => {
	console.log("triggered");
	if (!input.value) {
		output.replaceChildren();
		download.hidden = true;
		return 
	}
	try {
		let svg = await generateQR(input.value);
		output.innerHTML = svg;
		download.href = 'data:image/svg+xml;chaset=utf-8,' + encodeURIComponent(svg);
		download.download = input.value;
		download.hidden = false;
	} catch (err) {
		console.error(err);
	}
});

