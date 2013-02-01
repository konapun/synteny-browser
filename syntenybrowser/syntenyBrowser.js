var SyntenyBrowser = function(div, opts) {
	/* Set up scaffolding */
	var
	topBrowsers = document.createElement('div'),
	bottomBrowsers = document.createElement('div'),
	syntenyArea = document.createElement('div'),
	syntenyCanvas = document.createElement('canvas');
	
	syntenyArea.appendChild(syntenyCanvas);
	div.appendChild(topBrowsers);
	div.appendChild(syntenyArea);
	div.appendChild(bottomBrowsers);
	
	this.syntenyBrowser = div;
	this.topArea = topBrowsers;
	this.syntenyCanvas = syntenyCanvas;
	this.bottomArea = bottomBrowsers;
	this.browsers = [];
	this.width = 1000;
};

SyntenyBrowser.prototype = function() {
	var
	addSequence = function(sequence, start) {
		var scriblCanvas = document.createElement('canvas');
		scriblCanvas.width = this.width;
		
		var browser = new SyntenyBrowser.Browser(scriblCanvas);
		browser.scribl.addGene(start, start + sequence.length, '+'); //FIXME: not a gene (use sequence glyph instead)
		
		this.browsers.push(browser);
		return browser;
	},
	width = function(width) {
		if (typeof width !== 'undefined') {
			this.width = width;
		}
		
		return this.width;
	},
	draw = function() {
		var loadTop = true;
		for (var i = 0, length = this.browsers.length; i < length; i++) {
			var
			loadArea = loadTop ? this.topArea : this.bottomArea,
			browser = this.browsers[i],
			canvas = browser.scribl.canvas;
			
			loadArea.appendChild(canvas);
			browser.scribl.draw();
			loadTop = !loadTop;
		}
	};
	
	return {
		addSequence: addSequence,
		width: width,
		draw: draw
	};
}();

SyntenyBrowser.Browser = function(canvas) {
	this.scribl = new Scribl(canvas, canvas.width);
};

SyntenyBrowser.Browser.prototype = function() {
	var
	selectRegion = function(start, end) {
		var
		scribl = this.scribl,
		scriblCanvas = scribl.canvas,
		ctx = scriblCanvas.getContext('2d'),
		scaleStart = scribl.scale.min,
		scaleEnd = scribl.scale.max,
		region = new SyntenyBrowser.Region(this, start, end);
		
		/* hilight the region */
		var
		pxPerNucs = scribl.pixelsToNts(),
		padding = 15,
		drawStartX = padding + (start * pxPerNucs),
		drawStartY = 10, //FIXME: start at scale start?
		drawEndX = padding + (end * pxPerNucs),
		drawEndY = 50; //FIXME
		
		console.log("Sequence coords are (" + start + ", " + end + ")");
		console.log("Drawing (" + drawStartX + ", " + drawStartY + ", " + (drawEndX - drawStartX) + ", " + (drawEndY - drawStartY) + ")");
		ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
		ctx.fillRect(drawStartX, drawStartY, drawEndX - drawStartX, drawEndY - drawStartY);
		
		return region;
	};
	
	return {
		selectRegion: selectRegion
	};
}();

SyntenyBrowser.Region = function(canvas, glyph1, glyph2) {
	canvas.width = 1000;
	canvas.height = 200;
	
	this.canvas = canvas;
	this.glyph1 = glyph1;
	this.glyph2 = glyph2;
};

SyntenyBrowser.Region.prototype = function() {
	var
	compareWith = function(region) {
		var alignService = 'align_sequence.php'; // Ideally, this would be a webservice
		//TODO
	};
	
	return {
		compareWith: compareWith
	};
}();

SyntenyBrowser.SyntenyGlyph = function() {

};

SyntenyBrowser.SyntenyGlyph.prototype = function() {

}();