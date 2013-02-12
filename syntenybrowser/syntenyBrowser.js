/*
* syntenyBrowser.js: Compare two regions of different sequences
*
* Author: Bremen Braun, 2013 for FlyExpress (http://www.flyexpress.net/)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/*
* syntenyBrowser.js: Compare two regions of different sequences
*
* Author: Bremen Braun, 2013 for FlyExpress (http://www.flyexpress.net/)
*/
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
		for (var i = 0, length = this.browsers.length; i < length; i++) {
			var
			browser = this.browsers[i];
			if (i%2 == 0) { // load on top
				browser.scribl.addScale();
			}
			
			browser.draw();
		}
		
		return mergeCanvases(this);
	},
	
	/* Private functions */
	mergeCanvases = function(caller) {
		var
		merged = caller.canvas,
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
			scribl = browser.scribl,
			canvas = browser.scribl.canvas;
			
			if (i%2 == 0) { // draw on top
				ctx.drawImage(canvas, 0, yTop);
				browser.top = yTop;
				
				yTop += scribl.getHeight();
			}
			else { // draw on bottom
				ctx.drawImage(canvas, 0, yBottom);
				browser.top = yBottom;
				
				yBottom -= scribl.getHeight();
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
	drawsOnTop = function() {
		return this.browser.browsers.indexOf(this)%2 == 0;
	},
	draw = function() {
		var scriblCanvas = this.scribl.canvas;
		scriblCanvas.getContext('2d').clearRect(0, 0, scriblCanvas.width, scriblCanvas.height);
		scriblCanvas.height = this.scribl.getHeight();
		
		this.scribl.draw();
		for (var i = 0; i < this.regions.length; i++) {
			this.regions[i].draw();
		}
	};
	
	return {
		selectRegion: selectRegion,
		drawsOnTop: drawsOnTop,
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
	compareWith = function(region, doneCallback) {
		var
		that = this,
		seq1 = this.sequence(),
		seq2 = region.sequence();
		
		return runAligner(seq1, seq2, function(results) {
			if (results === 'error') {
				console.log("Alignment failed");
			}
			else {
				var alignResults = $.parseJSON(results);
				if (alignResults.subject != null) {
					var
					alignment = new SyntenyBrowser.Alignment(alignResults.subject, alignResults.query),
					canvas = that.owner.browser.draw();
					
					alignment.draw(canvas, that, region);
					projectToAlignment(that, canvas, alignment);
					projectToAlignment(region, canvas, alignment);
				}
			}
			
			return doneCallback(alignResults);
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
		ctx = this.owner.scribl.canvas.getContext('2d'),
		coords = calculateDrawCoords(this);
		this.coords = coords;
		
		ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
		ctx.fillRect(coords.x1, coords.y1, coords.x2 - coords.x1, coords.y2 - coords.y1);
	},
	
	/* private functions */
	calculateDrawCoords = function(region) {
		var
		owner = region.owner,
		start = region.start - owner.start,
		end = region.end - owner.start,
		scribl = owner.scribl,
		scriblCanvas = scribl.canvas,
		ctx = scriblCanvas.getContext('2d'),
		scaleStart = scribl.scale.min,
		scaleEnd = scribl.scale.max,
		pxPerNucs = scribl.pixelsToNts(),
		padding = 15,
		drawStartX = padding + (start * pxPerNucs),
		drawStartY = 10,
		drawEndX = padding + (end * pxPerNucs),
		drawEndY = 30;
		
		if (owner.drawsOnTop()) {
			var offset = 0;
			for (var i = 0, length = scribl.tracks.length; i < length; i++) {
				offset += scribl.tracks[i].getHeight();
			}
			
			drawEndY += offset - 24;
			drawStartY = drawEndY - 20;
		}
		
		return {
			x1: drawStartX,
			y1: drawStartY,
			x2: drawEndX,
			y2: drawEndY
		};
	},
	runAligner = function(seq1, seq2, onDone) {
		var
		done,
		results,
		alignService = 'pairwise_align.php?sequence1=' + seq1 + '&sequence2=' + seq2;
		
		$.ajax({
			url: alignService,
			async: true,
			success: function(data) {
				results = data;
			},
			error: function() {
				results = 'error';
			}
		}).done(function() {
			done = onDone(results);
		});
		
		return done;
	},
	projectToAlignment = function(caller, canvas, alignment) {
		var
		ctx = canvas.getContext('2d'),
		regionX1 = caller.coords.x1,
		regionY1 = caller.owner.top + caller.coords.y1,
		regionX2 = caller.coords.x2,
		regionY2 = caller.owner.top + caller.coords.y2,
		alignment1X1 = alignment.coords.startX1 + 12,
		alignment1X2 = alignment.coords.endX1 + 12,
		alignment2X1 = alignment.coords.startX2 + 12,
		alignment2X2 = alignment.coords.endX2 + 12,
		alignmentY1 = alignment.coords.startY,
		alignmentY2 = alignment.coords.endY;
		
		if (alignment.seq1.length > 0) { // don't project to empty alignment
			ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
			ctx.beginPath();
			if (caller.owner.drawsOnTop()) { // project from bottom			
				ctx.moveTo(regionX1, regionY2);
				ctx.lineTo(alignment1X1, alignmentY1);
				ctx.lineTo(alignment1X2, alignmentY1);
				ctx.lineTo(regionX2, regionY2);
				ctx.lineTo(regionX1, regionY2);
			}
			else { // project from top
				ctx.moveTo(regionX1, regionY1);
				ctx.lineTo(alignment2X1, alignmentY2);
				ctx.lineTo(alignment2X2, alignmentY2);
				ctx.lineTo(regionX2, regionY1);
				ctx.lineTo(regionX1, regionY1);
			}
			
			ctx.fill();
		}
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
	this.pxPerNuc = 20;
};

SyntenyBrowser.Alignment.prototype = function() {
	var
	clear = function() {
		//TODO i
	},
	draw = function(canvas, region1, region2) {
		var
		ctx = canvas.getContext('2d'),
		scriblCanvas = document.createElement('canvas');
		
		scriblCanvas.width = 1000;
		var
		scribl = new Scribl(scriblCanvas, scriblCanvas.width),
		seqlen = this.seq1.length > this.seq2.length ? this.seq1.length : this.seq2.length;
		proposedWidth = this.pxPerNuc * seqlen,
		seqGlyph1 = scribl.addFeature(new Seq('sequence1', 0, this.seq1.length, this.seq1)),
		seqGlyph2 = scribl.addFeature(new Seq('sequence2', 0, this.seq2.length, this.seq2));
		
		scribl.laneSizes = 18;
		scribl.scale.off = true;
		if (proposedWidth < scribl.width) { // only shrink
			scribl.width = proposedWidth;
		}
		scribl.draw();
		
		var
		scriblCanvas = scribl.canvas,
		paddingY = 25,
		centerX = canvas.width / 2,
		drawStartX1 = (scriblCanvas.width / 2) - (scribl.width / 2),
		drawEndX1 = drawStartX1 + seqGlyph1.getPixelLength(),
		drawStartX2 = drawStartX1,
		drawEndX2 = drawStartX2 + seqGlyph2.getPixelLength(),
		drawStartY = region1.owner.scribl.getHeight() + (canvas.height - (region1.owner.scribl.getHeight() + region2.owner.scribl.getHeight()))/2 - (scriblCanvas.height / 2), //FIXME
		drawEndY = drawStartY + scribl.getHeight() - paddingY;
		
		this.coords = {
			startX1: drawStartX1,
			endX1: drawEndX1,
			startX2: drawStartX2,
			endX2: drawEndX2,
			startY: drawStartY,
			endY: drawEndY
		};
		
		ctx.drawImage(scriblCanvas, drawStartX1, drawStartY);
	}; 
	
	return {
		clear: clear,
		draw: draw
	};
}();