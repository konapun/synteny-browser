var SyntenyBrowser = function(div, opts) {
	var canvas = document.createElement('canvas');
	div.appendChild(canvas);
	
	var syntenyHeight = 200, width = 1000;
	if (typeof opts !== 'undefined') {
		syntenyHeight = opts.syntenyHeight || syntenyHeight;
		width = opts.width || width;
	}
	
	this.canvas = canvas;
	this.syntenyBrowser = div;
	this.browsers = [];
	this.syntenyHeight = syntenyHeight;
	this.width = width;
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
			this.browsers[i].draw();
		}
		
		return mergeCanvases(this);
	},
	
	/* Private functions */
	mergeCanvases = function(caller) {
		var
		merged = caller.canvas,//document.createElement('canvas'),
		ctx = merged.getContext('2d');
		
		var height = caller.syntenyHeight;
		for (var i = 0, len = caller.browsers.length; i < len; i++) {
			height += caller.browsers[i].scribl.getHeight();
		}
		
		merged.height = height;
		merged.width = caller.browsers[0].scribl.canvas.width;
		ctx.clearRect(0, 0, merged.width, merged.height);
		
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
	
	scribl.scale.min = start;
	scribl.scale.max = start + sequence.length;
	
	this.scribl = scribl;
	this.browser = browser;
	this.sequence = sequence;
	this.start = start;
	this.regions = [];
};

SyntenyBrowser.Browser.prototype = function() {
	var
	selectRegion = function(start, end) {
		var region = new SyntenyBrowser.Region(this, start, end);
		this.regions.push(region);
		
		region.draw();
		this.browser.draw();
		
		return region;
	},
	draw = function() {
		var scriblCanvas = this.scribl.canvas;
		scriblCanvas.getContext('2d').clearRect(0, 0, scriblCanvas.width, scriblCanvas.height);
		this.scribl.draw();
		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].draw();
		}
	};
	
	return {
		selectRegion: selectRegion,
		draw: draw
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
		var
		owner = this.owner,
		seqStart = owner.start,
		regionStart = this.start,
		regionEnd = this.end,
		sequence = owner.sequence;
		
		return sequence.substring(regionStart - seqStart, regionEnd - seqStart);
	},
	compareWith = function(region) {
		var
		that = this,
		seq1 = this.sequence(),
		seq2 = region.sequence(),
		alignment = runAligner(seq1, seq2, function(results) {
			if (results === 'error') {
				console.log("Alignment failed");
			}
			else {
				console.log("Got results " + results);
				var
				alignment = new SyntenyBrowser.Alignment(results, results),
				canvas = that.owner.browser.draw();
				
				alignment.draw(canvas);
				projectToAlignment(that, canvas, alignment);
				projectToAlignment(region, canvas, alignment);
			}
		});
	},
	clear = function() {
		var
		owner = this.owner,
		browser = owner.browser;
		
		for (var i = 0, len = owner.regions.length; i < len; i++) {
			var region = owner.regions[i];
			
			if (region == this) {
				var
				found = owner.regions.splice(i, 1),
				canvas = browser.canvas,
				ctx = canvas.getContext('2d');
				
				browser.draw();
				return found;
			}
		}
	},
	draw = function() {
		var
		owner = this.owner,
		start = this.start - owner.start,
		end = this.end - owner.start,
		scribl = owner.scribl,
		scriblCanvas = scribl.canvas,
		ctx = scriblCanvas.getContext('2d'),
		scaleStart = scribl.scale.min,
		scaleEnd = scribl.scale.max, //FIXME: NOT the same as scaleStart + owner.sequence.length, throws off pxpernucs too
		region = this,
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
	},
	
	/* private functions */
	runAligner = function(seq1, seq2, onDone) {
		var
		results,
		alignService = 'pairwise_align.php?sequence1=' + seq1 + '&sequence2=' + seq2;
		
		$.ajax({
			url: alignService,
			success: function(data) {
				results = data;
			},
			error: function() {
				results = 'error';
			}
		}).done(function() {
			onDone(results);
		});
	},
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
		compareWith: compareWith,
		clear: clear,
		draw: draw
	};
}();

SyntenyBrowser.Alignment = function(seq1, seq2) {
	this.seq1 = seq1;
	this.seq2 = seq2;
	this.pxPerNuc = 10;
};

SyntenyBrowser.Alignment.prototype = function() {
	var
	clear = function() {
		//TODO i
	},
	draw = function(canvas) {
		var
		ctx = canvas.getContext('2d'),
		scriblCanvas = document.createElement('canvas');
		
		scriblCanvas.width = 900;
		var
		scribl = new Scribl(scriblCanvas, scriblCanvas.width),
		seqlen = this.seq1.length > this.seq2.length ? this.seq1.length : this.seq2.length;
		proposedWidth = this.pxPerNuc * seqlen,
		seqGlyph1 = scribl.addFeature(new Seq('sequence1', 0, this.seq1.length, this.seq1)),
		seqGlyph2 = scribl.addFeature(new Seq('sequence2', 0, this.seq2.length, this.seq2));
		
		scribl.laneSizes = 18;
		scribl.scale.off = true;
		if (proposedWidth < scriblCanvas.width) {
			//TODO
		}
		scribl.draw();
		
		//FIXME: use glyph.getPixelPositionX and glyph.getPixelPositionY for position calculations
		//FIXME: seq.getHeight(), seq.getPixelLength()
		var
		scriblCanvas = scribl.canvas,
		paddingX = 12,
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