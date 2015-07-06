##APT-3000

----------

A browser-based APT decoder for NOAA satellites.

###TODO:
- [x] Demodulate AM signal
- [x] Perform convolution to find sync signals
- [x] Draw image signal onto canvas
- [ ] Straighten image
  - A good way to do this would be to perform a convolution for every line
- [ ] Add scaling to the canvas
- [ ] Implement image rotation based on satellite orbit (N/S)
  - Telemetry 
- [ ] Implement false-color correction
- [ ] Submit a fork/push of ffdead's wav.js
  - I implemented an effective version of ffdead's blank "getSamples" function


###Works Cited 
*(helpful pages from around the web)*:
- http://www.ncdc.noaa.gov/oa/pod-guide/ncdc/docs/klm/html/c4/sec4-2.htm
- http://markroland.com/project/weather-satellite-imaging/APT_decode.m
- https://github.com/ffdead/wav.js/blob/master/wav.js
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas

