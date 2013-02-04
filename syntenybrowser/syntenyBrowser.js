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
	this.bottomArea = bottomBrowsers;
	this.browsers = [];
	this.syntenyHeight = 200;
	this.width = 1000;
};

SyntenyBrowser.prototype = function() {
	var
	addSequence = function(sequence, start) {
		var scriblCanvas = document.createElement('canvas');
		scriblCanvas.width = this.width;
		
		var browser = new SyntenyBrowser.Browser(this, scriblCanvas, sequence, start);
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
		
		return mergeCanvases(this);
	},
	
	/* Private functions */
	mergeCanvases = function(caller) {
		var
		merged = document.createElement('canvas'),
		ctx = merged.getContext('2d');
		
		var height = caller.syntenyHeight;
		for (var i = 0, len = caller.browsers.length; i < len; i++) {
			height += caller.browsers[i].scribl.getHeight();
		}
		
		merged.height = height;
		merged.width = caller.browsers[0].scribl.canvas.width;
		
		var
		yTop = 0,
		yBottom = height - caller.browsers[caller.browsers.length-1].scribl.getHeight();
		for (var i = 0, len = caller.browsers.length; i < len; i++) {
			var
			browser = caller.browsers[i],
			canvas = browser.scribl.canvas;
			
			if (i%2 == 0) { // draw on top
				ctx.drawImage(canvas, 0, yTop);
				browser.top = yTop;
				
				yTop += canvas.height;
			}
			else { // draw on bottom
				ctx.drawImage(canvas, 0, yBottom);
				browser.top = yBottom;
				
				yBottom -= canvas.height;
			}
		}
		
		$(caller.syntenyBrowser).empty();
		caller.syntenyBrowser.appendChild(merged);
		
		return merged;
	};
	
	return {
		addSequence: addSequence,
		width: width,
		draw: draw
	};
}();

SyntenyBrowser.Browser = function(browser, canvas, sequence, start) {
	var
	scribl = new Scribl(canvas, canvas.width),
	track = scribl.addTrack();
	
	track.addFeature(new Seq('sequence', start, start + sequence.length, sequence));
	track.hide = true;
		
	this.scribl = scribl;
	this.browser = browser;
	this.sequence = sequence;
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
		region = new SyntenyBrowser.Region(this, this.browser.syntenyCanvas, start, end),
		pxPerNucs = scribl.pixelsToNts(),
		padding = 15,
		drawStartX = padding + (start * pxPerNucs),
		drawStartY = 10,
		drawEndX = padding + (end * pxPerNucs),
		drawEndY = 30;
		
		ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
		ctx.fillRect(drawStartX, drawStartY, drawEndX - drawStartX, drawEndY - drawStartY);
		
		region.drawStartX = drawStartX;
		region.drawEndX = drawEndX;
		region.drawStartY = drawStartY;
		region.drawEndY = drawEndY;
		
		this.browser.draw();
		
		return region;
	};
	
	return {
		selectRegion: selectRegion
	};
}();

SyntenyBrowser.Region = function(regionOwner, start, end) {
	this.owner = regionOwner;
	this.start = start;
	this.end = end;
};

SyntenyBrowser.Region.prototype = function() {
	var
	sequence = function() {
		//return this.owner.
		//TODO
		return 'ACTGCAG';
	},
	compareWith = function(region) {
		var
		seq1 = this.sequence(),
		seq2 = region.sequence(),
		alignServiceBase = 'http://www.ebi.ac.uk/Tools/services/wublast/';
		
		//TODO: the alignment
		var
		alignment = new SyntenyBrowser.Alignment(seq1, seq2),
		canvas = this.owner.browser.draw();
		
		alignment.draw(canvas);
		projectToAlignment(this, canvas, alignment);
		projectToAlignment(region, canvas, alignment);
	},
	
	/* private functions */
	projectToAlignment = function(caller, canvas, alignment) {
		var
		ctx = canvas.getContext('2d'),
		regionX1 = caller.drawStartX,
		regionY1 = caller.owner.top + caller.drawStartY,
		regionX2 = caller.drawEndX,
		regionY2 = caller.owner.top + caller.drawEndY,
		alignmentX1 = alignment.drawStartX,
		alignmentY1 = alignment.drawStartY,
		alignmentX2 = alignment.drawEndX,
		alignmentY2 = alignment.drawEndY;
		
		ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
		ctx.beginPath();
		if (caller.owner.browser.browsers.indexOf(caller.owner)%2 == 0) { // project from bottom			
			ctx.moveTo(regionX1, regionY2);
			ctx.lineTo(alignmentX1, alignmentY1);
			ctx.lineTo(alignmentX2, alignmentY1);
			ctx.lineTo(regionX2, regionY2);
			ctx.lineTo(regionX1, regionY2);
		}
		else { // project from top
			ctx.moveTo(regionX1, regionY1);
			ctx.lineTo(alignmentX1, alignmentY2);
			ctx.lineTo(alignmentX2, alignmentY2);
			ctx.lineTo(regionX2, regionY1);
			ctx.lineTo(regionX1, regionY1);
		}
		
		ctx.fill();
	};
	
	return {
		sequence: sequence,
		compareWith: compareWith
	};
}();

/* Internal Objects */
SyntenyBrowser.Alignment = function(seq1, seq2) {
	this.seq1 = seq1;
	this.seq2 = seq2;
	this.pxPerNuc = 10;
};

SyntenyBrowser.Alignment.prototype = function() {
	var
	clear = function() {
		
	},
	draw = function(canvas) {
		var
		ctx = canvas.getContext('2d'),
		scriblCanvas = document.createElement('canvas');
		
		scriblCanvas.width = 500;
		var
		scribl = new Scribl(scriblCanvas, scriblCanvas.width),
		seqlen = this.seq1.length > this.seq2.length ? this.seq1.length : this.seq2.length;
		proposedWidth = this.pxPerNuc * seqlen;
		if (proposedWidth < scriblCanvas.width) {
			//TODO
		}
		
		scribl.scale.off = true;
		scribl.addFeature(new Seq('sequence1', 0, this.seq1.length, this.seq1));
		scribl.addFeature(new Seq('sequence2', 0, this.seq2.length, this.seq2));
		scribl.draw();
		
		var
		scriblCanvas = scribl.canvas,
		paddingX = 10,
		paddingY = 25,
		centerX = canvas.width / 2,
		centerY = canvas.height / 2;
		drawStartX = centerX - scriblCanvas.width/2 + paddingX,
		drawEndX = drawStartX + scriblCanvas.width - paddingX,
		drawStartY = centerY - scriblCanvas.height/2,
		drawEndY = drawStartY + scribl.getHeight() - paddingY;
		
		this.drawStartX = drawStartX;
		this.drawEndX = drawEndX;
		this.drawStartY = drawStartY;
		this.drawEndY = drawEndY;
		ctx.drawImage(scriblCanvas, drawStartX - paddingX, drawStartY);
	};
	
	return {
		clear: clear,
		draw: draw
	};
}();