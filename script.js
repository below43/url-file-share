let createPayloadContainer;
let displayPayloadContainer;
let payloadError;
let filePreviewElement;
let fileContentElement;
let sizeWarning;
let fileInput;
let loading;

window.onload = function() {
	createPayloadContainer = document.getElementById('create-payload');
	displayPayloadContainer = document.getElementById('display-payload');
	payloadError = document.getElementById('payload-error');
	filePreviewElement = document.getElementById('filePreview');
	fileContentElement = document.getElementById('fileContent');
	sizeWarning = document.getElementById('size-warning');
	fileInput = document.getElementById('fileInput');
	loading = document.getElementById('loading');

	// See if there's a payload in the URL
	loadPayloadFromUrl();
};


function convertFile()
{
	loading.style.display = 'block';
	sizeWarning.style.display = 'none';
	const file = fileInput.files[0];
	if (file)
	{
		const reader = new FileReader();

		reader.onload = function (event)
		{
			try
			{
				const base64String = event.target.result.split(',')[1];
				const params = {
					filename: file.name,
					filesize: file.size,
					mimetype: file.type,
					uploaddate: getLocalIsoTimestamp(),
					data: base64String
				};

				this.payload = encodePayload(params);

				setPayload(this.payload);
			} catch (e)
			{
				console.error('Failed to convert file:', e);
				alert('Failed to convert file. Please try again.');
			} finally
			{
				loading.style.display = 'none';
			}
		};
		reader.readAsDataURL(file);
	} else
	{
		alert('Please select a file first.');
	}
}

function encodePayload(params)
{
	return btoa(JSON.stringify({
		filename: params.filename,
		filesize: params.filesize,
		mimetype: params.mimetype,
		uploaddate: params.uploaddate,
		data: params.data
	}));
}

function decodePayload(encodedPayload)
{
	try
	{
		return JSON.parse(atob(encodedPayload));
	} catch (e)
	{
		console.error('Failed to decode payload:', e);
		return null;
	}
}

function share()
{
	this.copyToClipboard('URL');
}

function copyPayload(event)
{
	if (event)
	{
		event.preventDefault();
	}
	this.copyToClipboard('Payload');
	return;
}

function copyToClipboard(type)
{
	let text = '';
	if (type === 'URL')
	{
		text = window.location.href;
	} else if (type === 'Payload')
	{
		text = `${this.payload}`;
	}

	navigator.clipboard.writeText(text).then(() =>
	{
		showToast(`${type} copied!`);
	}).catch(err =>
	{
		console.error('Could not copy text: ', err);
	});
}

function getLocalIsoTimestamp()
{
	const date = new Date();
	const offset = date.getTimezoneOffset();
	const sign = offset > 0 ? '-' : '+';
	const absOffset = Math.abs(offset);
	const hoursOffset = String(Math.floor(absOffset / 60)).padStart(2, '0');
	const minutesOffset = String(absOffset % 60).padStart(2, '0');
	const isoString = date.toISOString().split('.')[0];
	return `${isoString}${sign}${hoursOffset}:${minutesOffset}`;
}

function formatNumberWithCommas(number)
{
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showWarning()
{
	if (this.payload.length > 2000000)
	{
		sizeWarning.style.display = 'block';
	} else
	{
		sizeWarning.style.display = 'none';
	}
}

function showToast(message)
{
	const toast = document.getElementById('toast');
	toast.textContent = message;
	toast.className = 'show';
	setTimeout(() =>
	{
		toast.className = toast.className.replace('show', '');
	}, 3000);
}

function reset(event, updateState = true)
{
	if (event)
	{
		event.preventDefault();
	}
	this.payload = '';

	createPayloadContainer.style.display = 'inline';
	displayPayloadContainer.style.display = 'none';
	payloadError.style.display = 'none';
	sizeWarning.style.display = 'none';
	fileInput.value = '';
	filePreviewElement.innerHTML = '';
	fileContentElement.innerHTML = '';

	// Set the URL back to the base URL
	if (updateState)
	{
		history.pushState(null, '', `${window.location.origin}${window.location.pathname}`);
	}
}

function pastePayload(event)
{
	if (event)
	{
		event.preventDefault();
	}
	// Prompt for payload
	let pastedPayload = prompt("Paste a URL+payload that was generated from this app");

	if (pastedPayload)
	{
		try
		{
			if (pastedPayload.includes('#'))
			{
				pastedPayload = pastedPayload.substring(pastedPayload.indexOf('#') + 1);
			}
			this.payload = pastedPayload;
			var params = getQueryParamsFromPayload(pastedPayload);
			if (!params)
			{
				displayPayloadContainer.style.display = 'none';
				alert('Sorry, unable to parse that URL + Payload');
				return;
			}
			displayFileDetails(params);
		} catch (e)
		{
			console.error(e);
		}
	}
}

function showFileDetailsContainer()
{
	// Update the display with the file information
	createPayloadContainer.style.display = 'none';
	displayPayloadContainer.style.display = 'inline';
	payloadError.style.display = 'none';
}

function setPayload(payload)
{
	this.payload = payload;

	// Revert cursor back to default
	document.body.style.cursor = 'default';

	this.showWarning();

	// Update the URL in the browser address bar
	history.pushState(null, '', `${window.location.origin}${window.location.pathname}#${payload}`);

	var params = getQueryParamsFromPayload(payload);
	displayFileDetails(params);
}

let params = '';
function displayFileDetails(params)
{
	this.params = '';
	this.showFileDetailsContainer();

	const filenameElement = document.getElementById('filename');
	const fileSizeElement = document.getElementById('fileSize');
	const fileMimeTypeElement = document.getElementById('fileMimeType');
	const uploadDateElement = document.getElementById('uploadDate');
	if (params.base64String)
	{
		fileContentElement.innerHTML = '';
		this.params = params;

		document.title = `URL File Share - ${params.filename}`; // Update the page title with the filename
		filenameElement.textContent = params.filename;
		fileSizeElement.textContent = formatFileSize(params.filesize);
		fileMimeTypeElement.textContent = params.mimeType;
		uploadDateElement.textContent = params.uploadDate;

		const blob = base64ToBlob(params.base64String, params.mimeType);
		const url = URL.createObjectURL(blob);

		// Check if the file is an image
		if (params.filename.match(/\.(jpeg|jpg|gif|png)$/))
		{
			const imgLink = document.createElement('a');
			imgLink.href = url;
			imgLink.target = '_blank';

			const img = document.createElement('img');
			img.src = url;
			img.alt = params.filename;
			img.style.maxWidth = '200px';
			img.style.maxHeight = '200px';
			img.style.border = '1px solid #ccc';
			img.style.marginBottom = '10px';

			imgLink.appendChild(img);
			filePreviewElement.appendChild(imgLink);
		}

		const link = document.createElement('a');
		link.href = url;
		link.download = params.filename;
		link.innerHTML = '⬇ &nbsp;Download this file';
		link.className = 'button button-outline download-button';
		fileContentElement.appendChild(link);
	} else
	{
		fileContentElement.textContent = 'No data found.';
	}
}

function loadPayloadFromUrl()
{
	if (!window?.location?.hash)
	{
		this.reset(null, false);
		return;
	} else
	{
		try
		{
			const payload = window.location.hash.substring(1);
			if (!payload)
			{
				this.reset(null, false);
				return;
			}

			if (payload == 'privacy')
			{
				showModal(null, 'privacy');
				return;
			} else if (payload == 'terms')
			{
				showModal(null, 'terms');
				return;
			}

			this.payload = payload;
			this.showFileDetailsContainer();
			var params = this.getQueryParamsFromPayload(payload);
			if (!params)
			{
				displayPayloadContainer.style.display = 'none';
				payloadError.style.display = 'block';
				return;
			}
			this.displayFileDetails(params);

			this.showWarning();
		} catch (e)
		{
			console.error(e);
		}
	}
}

function getQueryParamsFromPayload(payload)
{
	try
	{
		const params = decodePayload(payload);
		return {
			base64String: params.data,
			filename: params.filename || 'downloaded_file',
			filesize: params.filesize || 'Unknown size',
			mimeType: params.mimetype || 'application/octet-stream',
			uploadDate: params.uploaddate || 'Unknown date'
		};
	} catch (e)
	{
		console.error(e);
		return null;
	}
}

function base64ToBlob(base64, mime)
{
	const byteCharacters = atob(base64);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++)
	{
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type: mime });
}

function formatFileSize(bytes)
{
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const formattedSize = (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
	return formattedSize.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showModal(event, modalId) {
    if (event) {
        event.preventDefault();
    }
    const modal = document.getElementById(modalId);
    modal.showModal();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.close();
}

function handleModalClick(event, modalId) {
    const modal = document.getElementById(modalId);
    if (event.target === modal) {
        closeModal(modalId);
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js') // Update the version here
    .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);

        // Check for updates to the service worker
        if (registration.waiting) {
            updateReady(registration.waiting);
        }

        registration.onupdatefound = function() {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = function() {
                if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New update available
                        console.log('New content is available; please refresh.');
                        // Optionally, you can prompt the user to refresh the page
                        if (confirm('New version available. Refresh now?')) {
                            window.location.reload();
                        }
                    } else {
                        // Content is cached for offline use
                        console.log('Content is cached for offline use.');
                    }
                }
            };
        };

        // Periodically check for updates
        setInterval(() => {
            registration.update();
        }, 60 * 60 * 1000); // Check every hour
    }).catch(function(error) {
        console.log('Service Worker registration failed:', error);
    });

    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}

function updateReady(worker) {
    worker.postMessage({ action: 'skipWaiting' });
}