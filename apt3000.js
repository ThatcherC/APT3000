var wavFile;
var ctx;
var myChart;
	
var lower = 80000;
var range = 200;

var numTaps = 50;
var coeffs = getLowPassFIRCoeffs(11025,1200,numTaps);
var filter = new FIRFilter(coeffs);

var f32samples;
var filteredData;
var signalMean = 0;

//drawing context
var imageCanvas = document.getElementById("output");
var imageCTX = imageCanvas.getContext("2d");
//used for showing A/B/AB
var pixelStep = 1;
var pixelStart = 0;

window.onload = function() {
	document.getElementById('spinner').style.visibility='hidden';
	document.getElementById('buttons').style.visibility='hidden';
	document.getElementById('alert').style.visibility='hidden';
	
	try {
	  FileReader = FileReader;
	}
	catch (e) {
	  console.log('Your browser does not support the File API');
	}
	
	var fileInput = document.getElementById('fileInput');
	
	fileInput.addEventListener('change', function(e) {
		var file = fileInput.files[0];
		document.getElementById('fileName').value=file.name;
		
		document.getElementById('spinner').style.visibility='visible';
		document.getElementById('buttons').style.visibility='hidden';
		document.getElementById('alert').style.visibility='hidden';
		
		wavFile = new wav(file);
		wavFile.onloadend = function () {
			console.log("loaded");
			
			if(wavFile.sampleRate!=11025){
				document.getElementById('alert').innerHTML="File must have a 11025Hz sample rate";
				document.getElementById('alert').style.visibility='visible';
				document.getElementById('spinner').style.visibility='hidden';
			}else{
				//rectification
				for(var c = 0; c<wavFile.dataSamples.length;c++){
					wavFile.dataSamples[c] = Math.abs(wavFile.dataSamples[c]);
				}
				console.log("rectified");
				filterSamples();
			}
		};
	});
}

function filterSamples(){
	//convert to Float32s
	f32samples = new Float32Array(wavFile.dataSamples.length);
	for(var i = 0; i < wavFile.dataSamples.length; i++){
		f32samples[i] = wavFile.dataSamples[i]/32768;
	}
	
	filter.loadSamples(f32samples);
	filteredData = new Float32Array(f32samples.length);
	
	for(var c = 0; c < f32samples.length; c++){
		filteredData[c] = filter.get(c);
	}
	
	console.log("Filtered");
	
	normalizeData();
	document.getElementById('spinner').style.visibility='hidden';
	document.getElementById('buttons').style.visibility='visible';
	
	//uncomment if using the chart
	//updateChart();
}

function normalizeData(){
	var maxVal = 0;
	var minVal = 1;
	for(var i = 0; i < filteredData.length; i++){
		if(filteredData[i]>maxVal){
			maxVal = filteredData[i];
		}
		if(filteredData[i]<minVal){
			minVal = filteredData[i];
		}
	}
	for(var i = 0; i < filteredData.length; i++){
		filteredData[i] = (filteredData[i]-minVal)/(maxVal-minVal);
		signalMean += filteredData[i];
	}
	signalMean = signalMean / filteredData.length;
}

function convolveWithSync(start,range){
	var sync = [-1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1, 1];
	var maxVal = 0;
	var maxIndex = 0;
	for(var i = start; i < start+range; i++){
		sum = 0;
		for(var c = 0; c < sync.length; c++){
			sum += (filteredData[i+c]-signalMean)*sync[c];
		}
		if(sum>maxVal){
			maxVal = sum;
			maxIndex = i;
		}
	}
	return {"index":maxIndex,"score":maxVal};
}

function updateChart(){
	var data = {
		labels:wavFile.dataSamples.subarray(lower,lower+range),
		datasets: [
			{
				label: "1040Hz",
				fillColor: "rgba(180,180,180,0.2)",
				strokeColor: "rgba(120,120,120,1)",
				pointColor: "rgba(120,120,120,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: [0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1]
			},
			{
				label: "Filtered",
				fillColor: "rgba(180,180,180,0.2)",
				strokeColor: "rgba(240,120,120,1)",
				pointColor: "rgba(240,120,120,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: filteredData.subarray(lower,lower+range)
			}
		]
	};
	ctx = document.getElementById("myChart").getContext("2d");	
	myChart = new Chart(ctx).Line(data);
}

//starting index comes from convolution, lineCount comes from math
//this kind of comes from https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
function createImage(startingIndex){
	lineCount = Math.floor(filteredData.length/5513)/pixelScale;
	imageCanvas.height = lineCount;
	var image = imageCTX.createImageData(1040,lineCount);
	
	var lineStartIndex = startingIndex;
	console.log(lineCount+" possible lines");
	
	var downSampler = new Downsampler(11025,4160,coeffs);
	var thisLineData;
	
	//each line
	for(var line = 0; line < lineCount; line++){
		//each column, currently only Channel A

		thisLineData = downSampler.downsample(filteredData.subarray(lineStartIndex+20,lineStartIndex+5533));
		
		for(var column = 0; column < 1040; column++){
			var value = thisLineData[pixelStart+column*pixelScale]*256;
			//R=G=B for grayscale
			image.data[line*1040*4 + column*4]=value;
			image.data[line*1040*4 + column*4+1]=value;
			image.data[line*1040*4 + column*4+2]=value;
			//alpha = 255
			image.data[line*1040*4 + column*4+3]=255;
		}
		//updating lineStartIndex to equal the start of the next
		//line helps straighten the image
		var conv = convolveWithSync(lineStartIndex+(5512*pixelScale)-20,40);
		//If the convolution actually found something, use that
		if(conv.score > 6){
			lineStartIndex = conv.index;
		}else{				//otherwise, just guess the next line
			lineStartIndex+=5512*pixelScale;
		}
	}
	imageCTX.putImageData(image,0,0);
}
	
function changeRange(dLower,dRange){
	lower += dLower;
	range += dRange;
	updateChart();
}

function setTaps(taps){
	numTaps = taps;
	filterSamples();
}

function viewA(){
	pixelScale = 1;
	pixelStart = 0;
	createImage(convolveWithSync(0,22050).index);
}
function viewB(){
	pixelScale = 1;
	pixelStart = 1040;
	createImage(convolveWithSync(0,22050).index);
}
function viewAB(){
	pixelScale = 2;
	pixelStart = 0;
	createImage(convolveWithSync(0,22050).index);
}
