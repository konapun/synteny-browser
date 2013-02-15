(function () {
    var a = !1,
        b = /xyz/.test(function () {}) ? /\b_super\b/ : /.*/;
    this.Class = function () {};
    Class.extend = function (c) {
        function d() {
            !a && this.init && this.init.apply(this, arguments)
        }
        var e = this.prototype;
        a = !0;
        var f = new this;
        a = !1;
        for (var g in c) f[g] = typeof c[g] == "function" && typeof e[g] == "function" && b.test(c[g]) ? function (a, b) {
            return function () {
                var c = this._super;
                this._super = e[a];
                var d = b.apply(this, arguments);
                this._super = c;
                return d
            }
        }(g, c[g]) : c[g];
        d.prototype = f;
        d.constructor = d;
        d.extend = arguments.callee;
        return d
    }
})();
var SCRIBL = {};
SCRIBL.chars = {};
SCRIBL.chars.nt_color = "white";
SCRIBL.chars.nt_A_bg = "red";
SCRIBL.chars.nt_G_bg = "blue";
SCRIBL.chars.nt_C_bg = "green";
SCRIBL.chars.nt_T_bg = "black";
SCRIBL.chars.nt_N_bg = "purple";
SCRIBL.chars.nt_dash_bg = "rgb(120,120,120)";
SCRIBL.chars.heights = [];
SCRIBL.chars.canvasHolder = document.createElement("canvas");
var Scribl = Class.extend({
    init: function (a, b) {
        this.scrolled = !1;
        var c;
        a && (c = a.getContext("2d"));
        var d = this;
        this.width = b;
        this.uid = _uniqueId("chart");
        this.laneSizes = 50;
        this.laneBuffer = 5;
        this.trackBuffer = 25;
        this.offset = void 0;
        this.canvas = a;
        this.ctx = c;
        this.scale = {};
        this.scale.pretty = !0;
        this.scale.max = void 0;
        this.scale.min = void 0;
        this.scale.auto = !0;
        this.scale.userControlled = !1;
        this.scale.positions = [0];
        this.scale.off = !1;
        this.scale.size = 15;
        this.scale.font = {};
        this.scale.font.size = 15;
        this.scale.font.color = "black";
        this.scale.font.buffer = 10;
        this.glyph = {};
        this.glyph.roundness = 6;
        this.glyph.borderWidth = 1;
        this.glyph.color = ["#99CCFF", "rgb(63, 128, 205)"];
        this.glyph.text = {};
        this.glyph.text.color = "black";
        this.glyph.text.size = "13";
        this.glyph.text.font = "arial";
        this.glyph.text.align = "center";
        this.gene = {};
        this.gene.text = {};
        this.protein = {};
        this.protein.text = {};
        this.events = {};
        this.events.hasClick = !1;
        this.events.hasMouseover = !1;
        this.events.clicks = [];
        this.events.mouseovers = [];
        this.events.added = !1;
        this.mouseHandler = function (a) {
            d.handleMouseEvent(a,
                "mouseover")
        };
        this.clickHandler = function (a) {
            d.handleMouseEvent(a, "click")
        };
        this.tick = {};
        this.tick.auto = !0;
        this.tick.major = {};
        this.tick.major.size = 10;
        this.tick.major.color = "black";
        this.tick.minor = {};
        this.tick.minor.size = 1;
        this.tick.minor.color = "rgb(55,55,55)";
        this.tick.halfColor = "rgb(10,10,10)";
        this.tooltips = {};
        this.tooltips.text = {};
        this.tooltips.text.font = "arial";
        this.tooltips.text.size = 12;
        this.tooltips.borderWidth = 1;
        this.tooltips.roundness = 5;
        this.tooltips.fade = !1;
        this.tooltips.style = "light";
        this.lastToolTips = [];
        this.scrollable = !1;
        this.scrollValues = [0, void 0];
        this.chars = {};
        this.chars.drawOnBuild = [];
        this.drawStyle = "expand";
        this.glyphHooks = [];
        this.trackHooks = [];
        this.myMouseEventHandler = new MouseEventHandler(this);
        this.tracks = []
    },
    getScaleHeight: function () {
        return this.scale.font.size + this.scale.size
    },
    getHeight: function () {
        var a = 0;
        this.scale.off || (a += this.getScaleHeight());
        for (var b = this.tracks.length, c = 0; c < b; c++) a += this.trackBuffer, a += this.tracks[c].getHeight();
        return a
    },
    getFeatures: function () {
        for (var a = [],
        b = 0; b < this.tracks.length; b++) for (var c = 0; c < this.tracks[b].lanes.length; c++) a = a.concat(this.tracks[b].lanes[c].features);
        return a
    },
    setCanvas: function (a) {
        this.canvas = a;
        this.ctx = a.getContext("2d")
    },
    addScale: function () {
        this.scale.userControlled ? this.scale.positions.push(this.tracks.length) : (this.scale.positions = [this.tracks.length], this.scale.userControlled = !0)
    },
    addTrack: function () {
        var a = new Track(this);
        if (this.tracks.length == 1 && this.tracks[0] == void 0) this.tracks = [];
        this.tracks.push(a);
        return a
    },
    removeTrack: function (a) {
        for (var b = 0; b < this.tracks.length; b++) a.uid == this.tracks[b].uid && this.tracks.splice(b, 1);
        delete a
    },
    loadGenbank: function (a) {
        genbank(a, this)
    },
    loadBed: function (a) {
        bed(a, this)
    },
    loadBam: function (a, b, c, d, e) {
        var f = this,
            g = f.addTrack();
        g.status = "waiting";
        makeBam(new BlobFetchable(a), new BlobFetchable(b), function (a) {
            f.file = a;
            a.fetch(c, d, e, function (a, b) {
                if (a) {
                    for (var c = 0; c < a.length; c += 1) g.addFeature(new BlockArrow("bam", a[c].pos, a[c].lengthOnRef, "+", {
                        seq: a[c].seq
                    }));
                    g.status = "received";
                    g.drawOnResponse && f.redraw()
                }
                b && alert("error: " + b)
            })
        });
        return g
    },
    loadFeatures: function (a) {
        for (var b = 0; b < a.length; b++) this.addFeature(a[b])
    },
    addGene: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("gene", a, b, c, d))
    },
    addProtein: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("protein", a, b, c, d))
    },
    addFeature: function (a) {
        (this.tracks[0] || this.addTrack()).addFeature(a);
        return a
    },
    slice: function (a, b, c) {
        c = c || "inclusive";
        var d = this.tracks.length,
            e = new Scribl(this.canvas, this.width);
        e.scale.min = this.scale.min;
        e.scale.max = this.scale.max;
        e.offset = this.offset;
        e.scale.off = this.scale.off;
        e.scale.pretty = this.scale.pretty;
        e.laneSizes = this.laneSizes;
        e.drawStyle = this.drawStyle;
        e.glyph = this.glyph;
        e.glyphHooks = this.glyphHooks;
        e.trackHooks = this.trackHooks;
        e.previousDrawStyle = this.previousDrawStyle;
        for (var f = 0; f < d; f++) {
            var g = this.tracks[f],
                h = e.addTrack();
            h.drawStyle = g.drawStyle;
            for (var i = g.lanes.length, k = 0; k < i; k++) for (var l = h.addLane(), j = g.lanes[k].features, m = 0; m < j.length; m++) {
                var n = j[m].position + j[m].length,
                    o = j[m].position;
                if (c == "inclusive") o >= a && o <= b ? l.addFeature(j[m].clone()) : n > a && n < b ? l.addFeature(j[m].clone()) : o < a && n > b ? l.addFeature(j[m].clone()) : o > a && n < b && l.addFeature(j[m].clone());
                else if (c == "strict") if (o >= a && o <= b) if (n > a && n < b) l.addFeature(j[m].clone());
                else {
                    var p = j[m].glyphType == "BlockArrow" && j[m].strand == "+" ? j[m].clone("Rect") : j[m].clone();
                    p.length = Math.abs(b - o);
                    l.addFeature(p)
                } else if (n > a && n < b) p = j[m].glyphType == "BlockArrow" && j[m].strand == "-" ? j[m].clone("Rect") : j[m].clone(), p.position = a, p.length = Math.abs(n - a), l.addFeature(p);
                else {
                    if (o < a && n > b) p = j[m].glyphType == "BlockArrow" ? j[m].clone("Rect") : j[m].clone(), p.position = a, p.length = Math.abs(b - a), l.addFeature(p)
                } else c == "exclusive" && o >= a && o <= b && n > a && n < b && l.addFeature(j[m].clone())
            }
        }
        return e
    },
    draw: function () {
        var a = this.ctx,
            b = this.tracks;
        this.scrollable == !0 && this.initScrollable();
        a.save();
        this.initScale();
        if (this.offset == void 0) this.offset = Math.ceil(a.measureText("0").width / 2 + 10);
        a.save();
        for (var c = 0; c < b.length; c++)!this.scale.off && this.scale.positions.indexOf(c) != -1 && this.drawScale(), b[c].draw();
        !this.scale.off && this.scale.positions.indexOf(b.length) != -1 && this.drawScale();
        a.restore();
        a.restore();
        this.events.added || this.registerEventListeners()
    },
    redraw: function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.tracks.length > 0 && this.draw()
    },
    initScale: function () {
        if (this.scale.pretty) {
            if (this.tick.auto) this.tick.major.size = this.determineMajorTick(), this.tick.minor.size = Math.round(this.tick.major.size / 10);
            if (this.scale.auto) this.scale.min -= this.scale.min % this.tick.major.size,
            this.scale.max = Math.round(this.scale.max / this.tick.major.size + 0.4) * this.tick.major.size
        }
    },
    drawScale: function (a) {
        var b = this.ctx,
            c = b.fillStyle;
        a && a.init && this.initScale();
        a = this.scale.font.size + this.scale.size;
        var d = this.scale.font.size + 2,
            e = this.scale.font.size + this.scale.size * 0.66,
            f = this.scale.font.size + this.scale.size * 0.33;
        b.font = this.scale.font.size + "px arial";
        b.textBaseline = "top";
        b.fillStyle = this.scale.font.color;
        if (this.offset == void 0) this.offset = Math.ceil(b.measureText("0").width / 2 + 10);
        for (var g = this.scale.min % this.tick.minor.size == 0 ? this.scale.min : this.scale.min - this.scale.min % this.tick.minor.size + this.tick.minor.size; g <= this.scale.max; g += this.tick.minor.size) {
            b.beginPath();
            var h = this.pixelsToNts(g - this.scale.min) + this.offset;
            if (g % this.tick.major.size == 0) {
                var i = this.getTickText(g);
                b.textAlign = "center";
                b.fillText(i, h, 0);
                b.moveTo(h, a);
                b.lineTo(h, d);
                b.strokeStyle = this.tick.major.color
            } else b.moveTo(h, a), g % (this.tick.major.size / 2) == 0 ? (b.strokeStyle = this.tick.halfColor, b.lineTo(h, f)) : (b.strokeStyle = this.tick.minor.color, b.lineTo(h, e));
            b.stroke()
        }
        b.fillStyle = c;
        b.translate(0, this.getScaleHeight() + this.laneBuffer)
    },
    pixelsToNts: function (a) {
        return a == void 0 ? this.width / (this.scale.max - this.scale.min) : this.width / (this.scale.max - this.scale.min) * a
    },
    ntsToPixels: function (a) {
        return a == void 0 ? 1 / this.pixelsToNts() : a / this.width
    },
    initScrollable: function () {
        var a;
        if (!this.scrolled) {
            a = document.createElement("div");
            var b = document.createElement("div"),
                c = document.createElement("div");
            c.id = "scribl-zoom-slider";
            c.className =
                "slider";
            c.style.cssFloat = "left";
            c.style.height = new String(this.canvas.height * 0.5) + "px";
            c.style.margin = "30px auto auto -20px";
            a.style.cssText = this.canvas.style.cssText;
            this.canvas.style.cssText = "";
            parentWidth = parseInt(this.canvas.width) + 25;
            a.style.width = parentWidth + "px";
            b.style.width = this.canvas.width + "px";
            b.style.overflow = "auto";
            b.id = "scroll-wrapper";
            this.canvas.parentNode.replaceChild(a, this.canvas);
            a.appendChild(c);
            b.appendChild(this.canvas);
            a.appendChild(b);
            jQuery(b).dragscrollable({
                dragSelector: "canvas:first",
                acceptPropagatedEvent: !1
            })
        }
        b = this.scale.max - this.scale.min;
        var d = this.scrollValues[1] || this.scale.max - b * 0.35;
        a = this.scrollValues[0] != void 0 ? this.scrollValues[0] : this.scale.max + b * 0.35;
        var e = (d - a) / document.getElementById("scroll-wrapper").style.width.split("px")[0];
        e = b / e || 100;
        this.canvas.width = e;
        this.width = e - 30;
        schart = this;
        d = (d - a) / (this.scale.max - this.scale.min) * 100 || 1;
        jQuery(c).slider({
            orientation: "vertical",
            range: "min",
            min: 6,
            max: 100,
            value: d,
            slide: function (a, b) {
                var c = schart.scale.max - schart.scale.min,
                    d = b.value / 100 * schart.canvas.width,
                    e = document.getElementById("scroll-wrapper");
                e = e.scrollLeft + parseInt(e.style.width.split("px")[0]) / 2;
                schart.scrollValues = [schart.scale.min + (e - d / 2) / schart.canvas.width * c, schart.scale.min + (e + d / 2) / schart.canvas.width * c];
                schart.ctx.clearRect(0, 0, schart.canvas.width, schart.canvas.height);
                schart.draw()
            }
        });
        c = (a - this.scale.min) / b * this.canvas.width;
        document.getElementById("scroll-wrapper").scrollLeft = c;
        this.scrolled = !0
    },
    determineMajorTick: function () {
        this.ctx.font = this.scale.font.size +
            "px arial";
        var a = (this.scale.max - this.scale.min) / (this.width / (this.ctx.measureText(this.getTickTextDecimalPlaces(this.scale.max)).width + this.scale.font.buffer)),
            b = Math.pow(10, parseInt(a).toString().length - 1);
        this.tick.major.size = Math.ceil(a / b) * b;
        a = Math.pow(10, (this.tick.major.size + "").length);
        b = this.tick.major.size / a;
        b > 0.1 && b <= 0.5 ? b = 0.5 : b > 0.5 && (b = 1);
        return b * a
    },
    getTickText: function (a) {
        if (!this.tick.auto) return a;
        var b = a;
        a >= 1E6 ? (a = Math.pow(10, 5), b = Math.round(b / 1E6 * a) / a + "m") : a >= 1E3 && (a = Math.pow(10,
        2), b = Math.round(b / 1E3 * a) / a + "k");
        return b
    },
    getTickTextDecimalPlaces: function (a) {
        if (!this.tick.auto) return a;
        var b = a;
        a >= 1E6 ? b = Math.round(b / (1E6 / Math.pow(10, 5))) + "m" : a >= 1E3 && (b = Math.round(b / (1E3 / Math.pow(10, 2))) + "k");
        return b
    },
    handleMouseEvent: function (a, b) {
        this.myMouseEventHandler.setMousePosition(a);
        for (var c = this.myMouseEventHandler.mouseY, d, e = 0; e < this.tracks.length; e++) for (var f = 0; f < this.tracks[e].lanes.length; f++) {
            var g = this.tracks[e].lanes[f].getPixelPositionY(),
                h = g + this.tracks[e].lanes[f].getHeight();
            if (c >= g && c <= h) {
                d = this.tracks[e].lanes[f];
                break
            }
        }
        if (d) {
            e = d.track.getDrawStyle();
            if (e == "collapse") this.redraw();
            else if (e != "line") {
                this.ctx.save();
                d.erase();
                this.ctx.translate(0, d.getPixelPositionY());
                for (d.draw(); e = this.lastToolTips.pop();) this.ctx.putImageData(e.pixels, e.x, e.y);
                this.ctx.restore()
            }
            d = b == "click" ? this.events.clicks : this.events.mouseovers;
            for (e = 0; e < d.length; e++) d[e](this);
            this.myMouseEventHandler.reset(this)
        }
    },
    addClickEventListener: function (a) {
        this.events.clicks.push(a)
    },
    addMouseoverEventListener: function (a) {
        this.events.mouseovers.push(a)
    },
    removeEventListeners: function (a) {
        a == "mouseover" ? this.canvas.removeEventListener("mousemove", this.mouseHandler) : a == "click" && this.canvas.removeEventListener("click", this.clickHandler)
    },
    registerEventListeners: function () {
        this.events.mouseovers.length > 0 && (this.canvas.removeEventListener("mousemove", this.mouseHandler), this.canvas.addEventListener("mousemove", this.mouseHandler, !1));
        this.events.clicks.length > 0 && (this.canvas.removeEventListener("click", this.clickHandler), this.canvas.addEventListener("click",
        this.clickHandler, !1));
        this.events.added = !0
    }
});
var Track = Class.extend({
    init: function (a) {
        this.chart = a;
        this.lanes = [];
        this.ctx = a.ctx;
        this.uid = _uniqueId("track");
        this.drawStyle = void 0;
        this.hide = !1;
        this.hooks = {};
        for (var b = 0; b < a.trackHooks.length; b++) this.addDrawHook(a.trackHooks[b]);
        this.coverageData = [];
        this.maxDepth = 0
    },
    addLane: function () {
        var a = new Lane(this.ctx, this);
        this.lanes.push(a);
        return a
    },
    addGene: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("gene", a, b, c, d))
    },
    addProtein: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("protein",
        a, b, c, d))
    },
    addFeature: function (a) {
        for (var b, c = !0, d = 0; d < this.lanes.length; d++) {
            var e = this.lanes[d].features[this.lanes[d].features.length - 1],
                f = 3 / this.chart.pixelsToNts() || 3;
            if (e != void 0 && a.position - f > e.position + e.length) {
                c = !1;
                b = this.lanes[d];
                break
            }
        }
        c && (b = this.addLane());
        b.addFeature(a);
        return a
    },
    hide: function () {
        this.hide = !0
    },
    unhide: function () {
        this.hide = !1
    },
    getDrawStyle: function () {
        return this.drawStyle ? this.drawStyle : this.chart.drawStyle
    },
    getHeight: function () {
        var a = 0,
            b = this.lanes.length,
            c = this.chart.laneBuffer,
            d = this.getDrawStyle();
        if (d == "line" || d == "collapse") b = 1;
        for (d = 0; d < b; d++) a += c, a += this.lanes[d].getHeight();
        a -= c;
        return a
    },
    getPixelPositionY: function () {
        var a;
        a = this.chart.scale.off ? 0 : this.chart.getScaleHeight() + this.chart.laneBuffer;
        for (var b = 0; b < this.chart.tracks.length; b++) {
            if (this.uid == this.chart.tracks[b].uid) break;
            a += this.chart.trackBuffer;
            a += this.chart.tracks[b].getHeight()
        }
        return a
    },
    calcCoverageData: function () {
        for (var a = this.lanes, b = this.chart.scale.min, c = this.chart.scale.max, d = 0; d < a.length; d++) for (var e = 0; e < a[d].features.length; e++) {
            var f = a[d].features[e],
                g = f.position,
                h = f.getEnd();
            if (g >= b && g <= c || h >= b && h <= c) {
                g = Math.round(f.getPixelPositionX());
                for (f = Math.round(g + f.getPixelLength()); g <= f; g++) this.coverageData[g] = this.coverageData[g] + 1 || 1, this.maxDepth = Math.max(this.coverageData[g], this.maxDepth)
            }
        }
    },
    erase: function () {
        this.chart.ctx.clearRect(0, this.getPixelPositionY(), this.chart.width, this.getHeight())
    },
    draw: function () {
        var a = !1,
            b;
        for (b in this.hooks) a = this.hooks[b](this) || a;
        if (this.status == "waiting") this.drawOnResponse = !0;
        else if (!this.hide) {
            var c = this.getDrawStyle();
            b = this.chart.laneSizes;
            var d = this.lanes,
                e = this.chart.laneBuffer,
                f = this.chart.trackBuffer,
                g = b + f,
                h = this.chart.ctx;
            if (!a) if (c == void 0 || c == "expand") for (b = 0; b < d.length; b++) d[b].y = g, d[b].draw() && (a = d[b].getHeight(), h.translate(0, a + e), g = g + a + e);
            else if (c == "collapse") {
                g = [];
                for (b = 0; b < d.length; b++) g = g.concat(d[b].filterFeaturesByPosition(this.chart.scale.min, this.chart.scale.max));
                g.sort(function (a, b) {
                    return a.position - b.position
                });
                for (b = 0; b < g.length; b++) a = g[b].length,
                c = g[b].name, g[b].draw(), g[b].length = a, g[b].name = c;
                d.length > 0 && h.translate(0, d[0].getHeight() + e)
            } else if (c == "line") {
                this.coverageData = [];
                this.coverageData.length == 0 && this.calcCoverageData();
                g = this.maxDepth;
                h.beginPath();
                for (a = this.chart.offset; a <= this.chart.width + this.chart.offset; a++) c = this.coverageData[a] / g * b || 0, c = b - c, h.lineTo(a, c);
                h.lineTo(this.chart.width + this.chart.offset, b);
                h.stroke();
                h.translate(0, d[0].getHeight() + e)
            }
            h.translate(0, f - e)
        }
    },
    addDrawHook: function (a, b) {
        var c = b || _uniqueId("drawHook");
        this.hooks[c] = a;
        return c
    },
    removeDrawHook: function (a) {
        delete this.hooks[a]
    }
});
var Lane = Class.extend({
    init: function (a, b) {
        this.height = void 0;
        this.features = [];
        this.ctx = a;
        this.track = b;
        this.chart = b.chart;
        this.uid = _uniqueId("lane")
    },
    addGene: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("gene", a, b, c, d))
    },
    addProtein: function (a, b, c, d) {
        return this.addFeature(new BlockArrow("protein", a, b, c, d))
    },
    addFeature: function (a) {
        a.lane = this;
        this.features.push(a);
        this.chart[a.type] || (this.chart[a.type] = {
            text: {}
        });
        if (a.length + a.position > this.chart.scale.max || !this.chart.scale.max) this.chart.scale.max = a.length + a.position;
        if (a.position < this.chart.scale.min || !this.chart.scale.min) this.chart.scale.min = a.position;
        return a
    },
    loadFeatures: function (a) {
        for (var b = a.length, c = 0; c < b; c++) this.addFeature(a[c])
    },
    getHeight: function () {
        return this.height != void 0 ? this.height : this.chart.laneSizes
    },
    getPixelPositionY: function () {
        for (var a = this.track.getPixelPositionY(), b = this.getHeight(), c = 0; c < this.track.lanes.length; c++) {
            if (this.uid == this.track.lanes[c].uid) break;
            a += this.track.chart.laneBuffer;
            a += b
        }
        return a
    },
    erase: function () {
        this.chart.ctx.clearRect(0,
        this.getPixelPositionY(), this.track.chart.canvas.width, this.getHeight())
    },
    draw: function () {
        for (var a = this.track.chart.scale.min, b = this.track.chart.scale.max, c = !1, d = 0; d < this.features.length; d++) {
            var e = this.features[d].position,
                f = this.features[d].getEnd();
            if (e >= a && e <= b || f >= a && f <= b) this.features[d].draw(), c = !0
        }
        return c
    },
    filterFeaturesByPosition: function (a, b) {
        for (var c = [], d = this.features.length, e = 0; e < d; e++) {
            var f = this.features[e].position,
                g = this.features[e].getEnd();
            (f >= a && f <= b || g >= a && g <= b) && c.push(this.features[e])
        }
        return c
    }
});
var Tooltip = Class.extend({
    init: function (a, b, c, d) {
        this.text = a;
        this.placement = b || "above";
        this.verticalOffset = c || 0;
        for (var e in d) this[e] = d[e];
        this.horizontalOffset = this.horizontalOffset || 0;
        this.ntOffset = this.ntOffset || 0
    },
    fire: function (a) {
        a = a || this.feature;
        this.chart = a.lane.track.chart;
        this.ctx = this.chart.ctx;
        this.draw(a, 1)
    },
    draw: function (a, b) {
        this.ctx.globalAlpha = b;
        var c = this.chart.tooltips.roundness,
            d = this.chart.tooltips.text.font,
            e = this.chart.tooltips.text.size,
            f = this.text || a.onMouseover;
        this.ctx.save();
        this.ctx.font = e + "px " + d;
        d = this.ctx.measureText(f);
        var g = [f],
            h = e + 10,
            i = d.width + 10,
            k, l;
        d = 0;
        a.seq && (d = this.ntOffset * (a.getPixelLength() / a.length));
        d = a.getPixelPositionX() + this.horizontalOffset + d;
        var j;
        j = this.placement == "below" ? a.getPixelPositionY() + a.getHeight() - this.verticalOffset : a.getPixelPositionY() - h - this.verticalOffset;
        a.getPixelLength();
        if (i > 200) g = this.ctx.measureText("s").width, g = parseInt(200 / g), f = ScriblWrapLines(g, f), i = 210, h = f[1] * e + 10, g = f[0];
        i + d > this.chart.width && (d = this.chart.width - i);
        if (this.chart.tooltips.style ==
            "light") k = this.chart.ctx.createLinearGradient(d + i / 2, j, d + i / 2, j + h), k.addColorStop(0, "rgb(253, 248, 196)"), k.addColorStop(0.75, "rgb(253, 248, 196)"), k.addColorStop(1, "white"), l = this.chart.ctx.createLinearGradient(d + i / 2, j, d + i / 2, j + h), l.addColorStop(0, "black"), l.addColorStop(1, "rgb(64, 64, 64)"), this.chart.tooltips.text.color = "black";
        else if (this.chart.tooltips.style == "dark") k = this.chart.ctx.createLinearGradient(d + i / 2, j, d + i / 2, j + h), k.addColorStop(0, "rgb(64, 64, 64)"), k.addColorStop(1, "rgb(121, 121, 121)"),
        l = "white", this.chart.tooltips.text.color = "white";
        this.chart.lastToolTips.push({
            pixels: this.ctx.getImageData(d - 1, j - 1, i + 2, h + 2),
            x: d - 1,
            y: j - 1
        });
        this.ctx.fillStyle = k;
        this.ctx.beginPath();
        tlc_ctrl_x = d;
        tlc_ctrl_y = j;
        tlc_lgth_x = d + c;
        tlc_lgth_y = j;
        tlc_wdth_x = d;
        tlc_wdth_y = j + c;
        blc_ctrl_x = d;
        blc_ctrl_y = j + h;
        blc_lgth_x = d + c;
        blc_lgth_y = j + h;
        blc_wdth_x = d;
        blc_wdth_y = j + h - c;
        brc_ctrl_x = d + i;
        brc_ctrl_y = j + h;
        brc_lgth_x = d + i - c;
        brc_lgth_y = j + h;
        brc_wdth_x = d + i;
        brc_wdth_y = j + h - c;
        trc_ctrl_x = d + i;
        trc_ctrl_y = j;
        trc_lgth_x = d + i - c;
        trc_lgth_y = j;
        trc_wdth_x = d + i;
        trc_wdth_y = j + c;
        this.ctx.moveTo(tlc_lgth_x, tlc_lgth_y);
        this.ctx.quadraticCurveTo(tlc_ctrl_x, tlc_ctrl_y, tlc_wdth_x, tlc_wdth_y);
        this.ctx.lineTo(blc_wdth_x, blc_wdth_y);
        this.ctx.quadraticCurveTo(blc_ctrl_x, blc_ctrl_y, blc_lgth_x, blc_lgth_y);
        this.ctx.lineTo(brc_lgth_x, brc_lgth_y);
        this.ctx.quadraticCurveTo(brc_ctrl_x, brc_ctrl_y, brc_wdth_x, brc_wdth_y);
        this.ctx.lineTo(trc_wdth_x, trc_wdth_y);
        this.ctx.quadraticCurveTo(trc_ctrl_x, trc_ctrl_y, trc_lgth_x, trc_lgth_y);
        this.ctx.lineTo(tlc_lgth_x, tlc_lgth_y);
        this.ctx.fill();
        this.ctx.lineWidth = this.chart.tooltips.borderWidth;
        this.ctx.strokeStyle = l;
        this.ctx.stroke();
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = this.chart.tooltips.text.color;
        for (c = 0; c < g.length; c++) this.ctx.measureText(g[c]), this.ctx.fillText(g[c], d + 5, j + e * (c + 1));
        this.ctx.restore()
    }
});
var MouseEventHandler = Class.extend({
    init: function (a) {
        this.chart = a;
        this.mouseY = this.mouseX = null;
        this.eventElement = void 0;
        this.isEventDetected = !1;
        this.tooltip = new Tooltip("", "above", -4)
    },
    addEvents: function (a) {
        var b = this.chart,
            c = b.ctx,
            d = b.myMouseEventHandler;
        if (a.onMouseover && !b.events.hasMouseover) b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseover), b.events.hasMouseover = !0;
        else if (a.tooltips.length > 0 && !b.events.hasMouseover) b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseover),
        b.events.hasMouseover = !0;
        else if (a.parent && a.parent.tooltips.length > 0 && !b.events.hasMouseover) b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseover), b.events.hasMouseover = !0;
        else if (a.parent && a.parent.onMouseover && !b.events.hasMouseover) b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseover), b.events.hasMouseover = !0;
        if (a.onClick && !b.events.hasClick) b.addClickEventListener(b.myMouseEventHandler.handleClick), b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseStyle),
        b.events.hasClick = !0;
        else if (a.parent && a.parent.onClick && !b.events.hasClick) b.addClickEventListener(b.myMouseEventHandler.handleClick), b.addMouseoverEventListener(b.myMouseEventHandler.handleMouseStyle), b.events.hasClick = !0;
        if (!d.isEventDetected && c.isPointInPath_mozilla(d.mouseX, d.mouseY)) d.eventElement = a, d.isEventDetected = !0
    },
    setMousePosition: function (a) {
        if (a != null) {
            var b = this.chart.canvas.getBoundingClientRect();
            this.mouseX = a.clientX - b.left;
            this.mouseY = a.clientY - b.top
        }
    },
    handleClick: function (a) {
        a = a.myMouseEventHandler.eventElement;
        var b;
        if (a != void 0 && a.onClick != void 0) b = a.onClick;
        else if (a && a.parent && a.parent.onClick) b = a.parent.onClick;
        b && (typeof b == "string" ? window.open(b) : typeof b == "function" && b(a))
    },
    handleMouseover: function (a) {
        a = a.myMouseEventHandler;
        var b = a.eventElement;
        if (b && b.onMouseover == void 0 && b.parent && b.parent.onMouseover) b.onMouseover = b.parent.onMouseover;
        if (b && b.onMouseover) if (typeof b.onMouseover == "string") a.tooltip.fire(b);
        else if (typeof b.onMouseover == "function") b.onMouseover(b);
        b && b.tooltips.length > 0 && b.fireTooltips()
    },
    handleMouseStyle: function (a) {
        var b = a.myMouseEventHandler.eventElement;
        a.ctx.canvas.style.cursor = b && b.onClick != void 0 ? "pointer" : b && b.parent && b.parent.onClick != void 0 ? "pointer" : "auto"
    },
    reset: function (a) {
        a = a.myMouseEventHandler;
        a.mouseX = null;
        a.mouseY = null;
        a.eventElement = void 0;
        a.isEventDetected = null;
        a.elementIndexCounter = 0
    }
});
CanvasRenderingContext2D.prototype.isPointInPath_mozilla = function (a, b) {
    if (navigator.userAgent.indexOf("Firefox") != -1) {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        var c = this.isPointInPath(a, b);
        this.restore()
    } else c = this.isPointInPath(a, b);
    return c
};

function ScriblWrapLines(a, b) {
    for (var c = [], d = "", e = 0, f = ("" + b).split(" "), g = 0; g < f.length; g++) f[g].length + d.length <= a ? d += " " + f[g] : d == "" ? (trunc1 = f[g].slice(0, a - 1), d += " " + trunc1 + "-", trunc2 = f[g].slice(a, f[g].length), f.splice(g + 1, 0, trunc2), c.push(d), d = "", e++) : (g--, c.push(d), e++, d = "");
    e++;
    c.push(d);
    return [c, e]
}
var idCounter = 0;
_uniqueId = function (a) {
    var b = idCounter++;
    return a ? a + b : b
};
Object.keys = Object.keys || function (a, b, c) {
    c = [];
    for (b in a) c.hasOwnProperty.call(a, b) && c.push(b);
    return c
};
if (!Array.prototype.indexOf) Array.prototype.indexOf = function (a) {
    if (this === void 0 || this === null) throw new TypeError;
    var b = Object(this),
        c = b.length >>> 0;
    if (c === 0) return -1;
    var d = 0;
    arguments.length > 0 && (d = Number(arguments[1]), d !== d ? d = 0 : d !== 0 && d !== Infinity && d !== -Infinity && (d = (d > 0 || -1) * Math.floor(Math.abs(d))));
    if (d >= c) return -1;
    for (d = d >= 0 ? d : Math.max(c - Math.abs(d), 0); d < c; d++) if (d in b && b[d] === a) return d;
    return -1
};
var CanvasToSVG = {
    idCounter: 0,
    convert: function (a, b, c, d) {
        var e = a.toDataURL(),
            f = document.createElementNS("http://www.w3.org/2000/svg", "image");
        f.setAttribute("id", "importedCanvas_" + this.idCounter++);
        f.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", e);
        f.setAttribute("x", c ? c : 0);
        f.setAttribute("y", d ? d : 0);
        f.setAttribute("width", a.width);
        f.setAttribute("height", a.height);
        f.imageData = a.toDataURL();
        b.appendChild(f)
    }
}, toXml = function (a) {
    return $("<p/>").text(a).html()
}, svgToString = function (a) {
    for (; removeUnusedDefElems() > 0;);
    pathActions.clear(!0);
    $.each(a.childNodes, function (b, c) {
        b && c.nodeType == 8 && c.data.indexOf("Created with") >= 0 && a.insertBefore(c, a.firstChild)
    });
    current_group && (leaveContext(), selectOnly([current_group]));
    var b = [];
    $(a).find("g:data(gsvg)").each(function () {
        for (var a = this.attributes, c = a.length, f = 0; f < c; f++)(a[f].nodeName == "id" || a[f].nodeName == "style") && c--;
        if (c <= 0) a = this.firstChild, b.push(a), $(this).replaceWith(a)
    });
    var c = svgToString(a, 0);
    b.length && $(b).each(function () {
        groupSvgElem(this)
    });
    return c
};
svgToString = function (a, b) {
    var c = [];
    if (a) {
        var d = a.attributes,
            e, f, g = a.childNodes;
        for (f = 0; f < b; f++) c.push(" ");
        c.push("<");
        c.push(a.nodeName);
        if (a.id == "svgcontent") {
            f = getResolution();
            c.push(' width="' + f.w + '" height="' + f.h + '" xmlns="' + svgns + '"');
            var h = {};
            $(a).find("*").andSelf().each(function () {
                $.each(this.attributes, function (a, b) {
                    var d = b.namespaceURI;
                    d && !h[d] && nsMap[d] !== "xmlns" && nsMap[d] !== "xml" && (h[d] = !0, c.push(" xmlns:" + nsMap[d] + '="' + d + '"'))
                })
            });
            for (f = d.length; f--;) {
                e = d.item(f);
                var i = toXml(e.nodeValue);
                if (e.nodeName.indexOf("xmlns:") !== 0 && i != "" && ["width", "height", "xmlns", "x", "y", "viewBox", "id", "overflow"].indexOf(e.localName) == -1 && (!e.namespaceURI || nsMap[e.namespaceURI])) c.push(" "), c.push(e.nodeName), c.push('="'), c.push(i), c.push('"')
            }
        } else for (f = d.length - 1; f >= 0; f--) e = d.item(f), i = toXml(e.nodeValue), !(["-moz-math-font-style", "_moz-math-font-style"].indexOf(e.localName) >= 0) && i != "" && i.indexOf("pointer-events") !== 0 && !(e.localName === "class" && i.indexOf("se_") === 0) && (c.push(" "), e.localName === "d" && (i = pathActions.convertPath(a, !0)), c.push(e.nodeName), c.push('="'), c.push(i), c.push('"'));
        if (a.hasChildNodes()) {
            c.push(">");
            b++;
            d = !1;
            for (f = 0; f < g.length; f++) switch (e = g.item(f), e.nodeType) {
                case 1:
                    c.push("\n");
                    c.push(svgToString(g.item(f), b));
                    break;
                case 3:
                    e = e.nodeValue.replace(/^\s+|\s+$/g, "");
                    e != "" && (d = !0, c.push(toXml(e) + ""));
                    break;
                case 8:
                    c.push("\n"), c.push(Array(b + 1).join(" ")), c.push("<\!--"), c.push(e.data), c.push("--\>")
            }
            b--;
            if (!d) {
                c.push("\n");
                for (f = 0; f < b; f++) c.push(" ")
            }
            c.push("</");
            c.push(a.nodeName);
            c.push(">")
        } else c.push("/>")
    }
    return c.join("")
};
var Glyph = Class.extend({
    init: function (a, b, c, d, e) {
        this.uid = _uniqueId("feature");
        this.position = b;
        this.length = c;
        this.strand = d;
        this.type = a;
        this.opts = {};
        this.name = "";
        this.borderColor = "none";
        this.borderWidth = void 0;
        this.ntLevel = 4;
        this.tooltips = [];
        this.hooks = {};
        this.addDrawHook(function (a) {
            if (a.ntLevel != void 0 && a.seq && a.lane.chart.ntsToPixels() < a.ntLevel) {
                var b = new Seq(a.type, a.position, a.length, a.seq, a.opts);
                b.lane = a.lane;
                b.ctx = a.ctx;
                b._draw();
                return !0
            }
            return !1
        }, "ntHook");
        this.text = {};
        this.text.font = void 0;
        this.text.size = void 0;
        this.text.color = void 0;
        this.onMouseover = this.onClick = this.text.align = void 0;
        for (var f in e) this[f] = e[f], this.opts[f] = e[f]
    },
    setColorGradient: function () {
        if (arguments.length == 1) this.color = arguments[0];
        else {
            for (var a = this.lane.ctx.createLinearGradient(this.length / 2, 0, this.length / 2, this.getHeight()), b, c = 0; b = arguments[c], c < arguments.length; c++) a.addColorStop(c / (arguments.length - 1), b);
            this.color = a
        }
    },
    getPixelLength: function () {
        return this.lane.chart.pixelsToNts(this.length) || 1
    },
    getPixelPositionX: function () {
        var a = parseInt(this.lane.track.chart.offset) || 0;
        return this.lane.track.chart.pixelsToNts(this.parent ? this.position + this.parent.position - this.lane.track.chart.scale.min : this.position - this.lane.track.chart.scale.min) + a
    },
    getPixelPositionY: function () {
        return this.lane.getPixelPositionY()
    },
    getEnd: function () {
        return this.position + this.length
    },
    clone: function (a) {
        a = a || this.glyphType;
        if (a == "Rect" || a == "Line") this.strand = void 0;
        if (this.strand) {
            a = "new " + a + '("' + this.type + '",' + this.position + "," + this.length + ',"' + this.strand +
                '",' + JSON.stringify(this.opts) + ")";
            a = eval(a);
            var b = Object.keys(this),
                c = 0
        } else a = "new " + a + '("' + this.type + '",' + this.position + "," + this.length + "," + JSON.stringify(this.opts) + ")", a = eval(a), b = Object.keys(this), c = 0;
        for (; c < b.length; c++) a[b[c]] = this[b[c]];
        a.tooltips = this.tooltips;
        a.hooks = this.hooks;
        return a
    },
    getAttr: function (a) {
        a = a.split("-");
        for (var b = this, c = 0; c < a.length; c++) b = b[a[c]];
        if (b) return b;
        if (this.parent) {
            b = this.parent;
            for (c = 0; c < a.length; c++) b = b[a[c]];
            if (b) return b
        }
        if (b = this.lane.chart[this.type]) {
            for (c = 0; c < a.length; c++) b = b[a[c]];
            if (b) return b
        }
        b = this.lane.chart.glyph;
        for (c = 0; c < a.length; c++) b = b[a[c]];
        if (b) return b
    },
    drawText: function (a) {
        var b = this.lane.chart.ctx,
            c = this.getPixelLength(),
            d = this.getHeight(),
            e = this.getAttr("text-size"),
            f = this.getAttr("text-style");
        b.font = e + "px " + f;
        b.textBaseline = "middle";
        b.fillStyle = this.getAttr("text-color");
        var g = void 0,
            h = this.getAttr("text-align");
        h == "start" ? h = this.strand == "+" ? "left" : "right" : h == "end" && (h = this.strand == "+" ? "right" : "left");
        b.textAlign = h;
        h == "left" ? g = 5 : h == "center" ? g = c / 2 : h == "right" && (g = c - 5);
        var i = b.measureText(a);
        if (a && a != "") {
            for (; c - i.width < 4;) if (e = /^\d+/.exec(b.font), e--, i = b.measureText(a), b.font = e + "px " + f, e <= 8) {
                a = "";
                break
            }
            this.glyphType == "Complex" && (c = 0, e = /^\d+/.exec(b.font), h == "center" && (c = -(b.measureText(a).width / 2 + 2.5)), b.clearRect(g + c, d / 2 - e / 2, b.measureText(a).width + 5, e));
            b.fillText(a, g, d / 2)
        }
    },
    calcRoundness: function () {
        var a = this.getHeight() * this.getAttr("roundness") / 100;
        return a = (a * 10 % 5 >= 2.5 ? parseInt(a * 10 / 5) * 5 + 5 : parseInt(a * 10 / 5) * 5) / 10
    },
    isContainedWithinRect: function (a,
    b, c, d) {
        var e = this.getPixelPositionY(),
            f = this.getPixelPositionX(),
            g = this.getPixelPositionX() + this.getPixelLength(),
            h = e + this.getHeight();
        return f >= a && g <= c && e >= b && h <= d
    },
    getHeight: function () {
        return this.lane.getHeight()
    },
    getFillStyle: function () {
        var a = this.getAttr("color");
        if (a instanceof Array) {
            for (var b = this.lane.track.chart.ctx.createLinearGradient(this.length / 2, 0, this.length / 2, this.getHeight()), c, d = 0; c = a[d], d < a.length; d++) b.addColorStop(d / (a.length - 1), c);
            return b
        } else return a instanceof Function ? (b = this.lane.track.chart.ctx.createLinearGradient(this.length / 2, 0, this.length / 2, this.getHeight()), a(b)) : a
    },
    getStrokeStyle: function () {
        var a = this.getAttr("borderColor");
        if (typeof a == "object") {
            for (var b = this.lane.ctx.createLinearGradient(this.length / 2, 0, this.length / 2, this.getHeight()), c, d = 0; c = a[d], d < a.length; d++) b.addColorStop(d / (a.length - 1), c);
            return b
        } else return a
    },
    isSubFeature: function () {
        return this.parent != void 0
    },
    erase: function () {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(this.getPixelPositionX(),
        this.getPixelPositionY(), this.getPixelLength(), this.getHeight());
        this.ctx.restore()
    },
    addDrawHook: function (a, b) {
        var c = b || _uniqueId("drawHook");
        this.hooks[c] = a;
        return c
    },
    removeDrawHook: function (a) {
        delete this.hooks[a]
    },
    addTooltip: function (a, b, c, d) {
        a = new Tooltip(a, b, c, d);
        a.feature = this;
        this.tooltips.push(a)
    },
    fireTooltips: function () {
        for (var a = 0; a < this.tooltips.length; a++) this.tooltips[a].fire()
    },
    draw: function () {
        this.ctx = this.lane.chart.ctx;
        this.ctx.beginPath();
        /^\d+/.exec(this.ctx.font);
        var a = /\S+$/.exec(this.ctx.font);
        this.onClick = this.getAttr("onClick");
        this.onMouseover = this.getAttr("onMouseover");
        this.ctx.fillStyle = this.getFillStyle();
        var b = this.ctx.fillStyle,
            c = this.getPixelPositionX(),
            d = this.getHeight();
        d < 10 ? this.ctx.font = "10px " + a : this.ctx.font = d * 0.9 + "px " + a;
        this.ctx.translate(c, 0);
        this.strand == "-" && !this.isSubFeature() && this.ctx.transform(-1, 0, 0, 1, this.getPixelLength(), 0);
        a = !1;
        for (var e in this.hooks) a = this.hooks[e](this) || a;
        a || this._draw();
        if (this.borderColor != "none") this.color == "none" && this.parent.glyphType ==
            "Complex" && this.erase(), e = this.ctx.strokeStyle, a = this.ctx.lineWidth, this.ctx.strokeStyle = this.getStrokeStyle(), this.ctx.lineWidth = this.getAttr("borderWidth"), this.ctx.stroke(), this.ctx.strokeStyle = e, this.ctx.lineWidth = a;
        this.color != "none" && this.ctx.fill();
        this.strand == "-" && !this.isSubFeature() && this.ctx.transform(-1, 0, 0, 1, this.getPixelLength(), 0);
        this.drawText(this.getAttr("name"));
        this.ctx.translate(-c, 0);
        this.ctx.fillStyle = b;
        this.lane.chart.myMouseEventHandler.addEvents(this)
    },
    redraw: function () {
        this.lane.ctx.save();
        this.lane.ctx.translate(0, this.getPixelPositionY());
        this.draw();
        this.lane.ctx.restore()
    }
});
var BlockArrow = Glyph.extend({
    init: function (a, b, c, d, e) {
        this._super(a, b, c, d, e);
        this.slope = 1;
        this.glyphType = "BlockArrow"
    },
    _draw: function (a, b, c, d) {
        a = a || this.ctx;
        b = b || this.getPixelLength();
        c = c || this.getHeight();
        d = d + 1 || this.calcRoundness();
        d != void 0 && (d -= 1);
        tc_ctrl_y = tc_ctrl_x = x = y = 0;
        tc_lgth_x = x + d;
        tc_lgth_y = y;
        tc_wdth_x = x;
        tc_wdth_y = y + d;
        bc_ctrl_x = x;
        bc_ctrl_y = y + c;
        bc_lgth_x = x + d;
        bc_lgth_y = y + c;
        bc_wdth_x = x;
        bc_wdth_y = y + c - d;
        a_b_x = x + b - d;
        a_t_x = x + b - d;
        a_max_x = x + b;
        t = 0.5;
        a_ctrl_x = Math.round((a_max_x - (1 - t) * (1 - t) * a_b_x - t * t * a_t_x) / (2 * (1 - t) * t) * 10) / 10;
        a_ctrl_y = y + c / 2;
        bs_slope = this.slope;
        bs_intercept = -a_ctrl_y - bs_slope * a_ctrl_x;
        ts_slope = -this.slope;
        ts_intercept = -a_ctrl_y - ts_slope * a_ctrl_x;
        a_b_y = -(Math.round((bs_slope * a_b_x + bs_intercept) * 10) / 10);
        a_t_y = -(Math.round((ts_slope * a_t_x + ts_intercept) * 10) / 10);
        bs_ctrl_y = y + c;
        bs_ctrl_x = (-bs_ctrl_y - bs_intercept) / this.slope;
        bs_ctrl_x < x ? (new Rect(this.type, 0, b))._draw(a, b, c, d) : (bs_lgth_y = y + c, bs_lgth_x = bs_ctrl_x - d, bs_slpe_x = bs_ctrl_x + d, bs_slpe_y = -(Math.round((bs_slope * bs_slpe_x + bs_intercept) * 10) / 10), ts_ctrl_y = y, ts_ctrl_x = (ts_ctrl_y + ts_intercept) / this.slope, ts_lgth_y = y, ts_lgth_x = ts_ctrl_x - d, ts_slpe_x = ts_ctrl_x + d, ts_slpe_y = -(Math.round((ts_slope * ts_slpe_x + ts_intercept) * 10) / 10), a.beginPath(), a.moveTo(tc_lgth_x, tc_lgth_y), a.quadraticCurveTo(tc_ctrl_x, tc_ctrl_y, tc_wdth_x, tc_wdth_y), a.lineTo(bc_wdth_x, bc_wdth_y), a.quadraticCurveTo(bc_ctrl_x, bc_ctrl_y, bc_lgth_x, bc_lgth_y), a.lineTo(bs_lgth_x, bs_lgth_y), a.quadraticCurveTo(bs_ctrl_x, bs_ctrl_y, bs_slpe_x, bs_slpe_y), a.lineTo(a_b_x, a_b_y), a.quadraticCurveTo(a_ctrl_x,
        a_ctrl_y, a_t_x, a_t_y), a.lineTo(ts_slpe_x, ts_slpe_y), a.quadraticCurveTo(ts_ctrl_x, ts_ctrl_y, ts_lgth_x, ts_lgth_y), a.lineTo(tc_lgth_x, tc_lgth_y))
    }
});
var Rect = Glyph.extend({
    init: function (a, b, c, d) {
        this._super(a, b, c, void 0, d);
        this.glyphType = "Rect"
    },
    _draw: function (a, b, c, d) {
        a = a || this.ctx;
        b = b || this.getPixelLength();
        c = c || this.getHeight();
        d = d + 1 || this.calcRoundness();
        d != void 0 && (d -= 1);
        x = y = 0;
        a.beginPath();
        tlc_ctrl_x = x;
        tlc_ctrl_y = y;
        tlc_lgth_x = x + d;
        tlc_lgth_y = y;
        tlc_wdth_x = x;
        tlc_wdth_y = y + d;
        blc_ctrl_x = x;
        blc_ctrl_y = y + c;
        blc_lgth_x = x + d;
        blc_lgth_y = y + c;
        blc_wdth_x = x;
        blc_wdth_y = y + c - d;
        brc_ctrl_x = x + b;
        brc_ctrl_y = y + c;
        brc_lgth_x = x + b - d;
        brc_lgth_y = y + c;
        brc_wdth_x = x + b;
        brc_wdth_y = y + c - d;
        trc_ctrl_x = x + b;
        trc_ctrl_y = y;
        trc_lgth_x = x + b - d;
        trc_lgth_y = y;
        trc_wdth_x = x + b;
        trc_wdth_y = y + d;
        a.moveTo(tlc_lgth_x, tlc_lgth_y);
        a.quadraticCurveTo(tlc_ctrl_x, tlc_ctrl_y, tlc_wdth_x, tlc_wdth_y);
        a.lineTo(blc_wdth_x, blc_wdth_y);
        a.quadraticCurveTo(blc_ctrl_x, blc_ctrl_y, blc_lgth_x, blc_lgth_y);
        a.lineTo(brc_lgth_x, brc_lgth_y);
        a.quadraticCurveTo(brc_ctrl_x, brc_ctrl_y, brc_wdth_x, brc_wdth_y);
        a.lineTo(trc_wdth_x, trc_wdth_y);
        a.quadraticCurveTo(trc_ctrl_x, trc_ctrl_y, trc_lgth_x, trc_lgth_y);
        a.lineTo(tlc_lgth_x, tlc_lgth_y)
    }
});
var Seq = Glyph.extend({
    init: function (a, b, c, d, e) {
        this.seq = d;
        this.insertions = [];
        this.fraction = 1;
        this.fractionLevel = 0.3;
        this.glyphType = "Seq";
        this.font = "8px courier";
        this.chars = {};
        this.chars.width = void 0;
        this.chars.height = void 0;
        this.chars.list = ["A", "G", "T", "C", "N", "-"];
        this._super(a, b, c, void 0, e)
    },
    _draw: function (a, b, c) {
        var d = 1;
        if (this.lane.chart.ntsToPixels() <= this.fractionLevel) d = this.fraction;
        a = a || this.ctx;
        b = b || this.getPixelLength();
        c = c || this.getHeight();
        var e = this.getPixelPositionX(),
            f = this.getPixelPositionY(),
            g = SCRIBL.chars;
        if (!g.heights[c]) {
            g.heights[c] = [];
            for (var h = 0; h < this.chars.list.length; h++) {
                var i = this.chars.list[h],
                    k = i;
                i == "-" && (k = "dash");
                this.createChar(i, g.nt_color, g["nt_" + k + "_bg"], c)
            }
        }
        x = y = 0;
        if (this.imgCanvas) a.drawImage(this.imgCanvas, e, f - c * d, b, c * d);
        else {
            a.save();
            a.beginPath();
            a.textBaseline = "middle";
            e = a.font;
            h = /[\d+px]/.exec(e) + "px";
            a.font = h + " courier";
            a.fillStyle = "black";
            a.textAlign = "left";
            h = this.seq.length * g.heights[c].width;
            this.imgCanvas = document.createElement("canvas");
            this.imgCanvas.width = h;
            this.imgCanvas.height = c;
            f = this.imgCanvas.getContext("2d");
            for (h = k = i = 0; h < this.seq.length; h++) {
                g.heights[c][this.seq[h]] || this.createChar(this.seq[h], "black", "white", c);
                var l = this.seq[h];
                this.insertions[k] && this.insertions[k].pos != void 0 && (this.insertions[k].pos - 1 == h ? l += "rightInsert" : this.insertions[k] && this.insertions[k].pos == h && (l += "leftInsert", k++));
                f.drawImage(g.heights[c][l], i, y);
                i += g.heights[c].width
            }
            a.drawImage(this.imgCanvas, x, c - c * d, b, c * d);
            a.font = e;
            a.restore()
        }
        a.beginPath();
        a.moveTo(0, 0);
        a.lineTo(b, y);
        a.lineTo(b, y + c);
        a.lineTo(x, y + c);
        a.lineTo(x, y);
        a.fillStyle = "rgba(0,0,0,0)";
        a.strokeStyle = this.lane.chart.ntsToPixels() <= this.fractionLevel ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)";
        a.stroke();
        a.closePath()
    },
    createChar: function (a, b, c, d) {
        var e = document.createElement("canvas"),
            f = e.getContext("2d"),
            g = d - 2;
        f.font = g + "px courier";
        var h = f.measureText(a).width + 2;
        e.height = d;
        e.width = h;
        SCRIBL.chars.heights[d].width = h;
        e = document.createElement("canvas");
        f = e.getContext("2d");
        f.font = g + "px courier";
        e.height = d;
        e.width = h;
        var i = f.fillStyle;
        f.fillStyle = c;
        f.fillRect(0, 0, h, d);
        f.fillStyle = b;
        f.textAlign = "center";
        f.textBaseline = "middle";
        f.fillText(a, h / 2, d / 2);
        SCRIBL.chars.heights[d][a] = e;
        f.fillStyle = i;
        e = document.createElement("canvas");
        f = e.getContext("2d");
        f.font = g + "px courier";
        e.height = d;
        e.width = h;
        i = f.fillStyle;
        f.fillStyle = c;
        f.fillRect(0, 0, h, d);
        f.fillStyle = "yellow";
        f.beginPath();
        f.moveTo(0, d);
        f.arcTo(h, d, h, 0, d / 2);
        f.lineTo(h, d);
        f.lineTo(0, d);
        f.closePath();
        f.fill();
        f.fillStyle = b;
        f.textAlign = "center";
        f.textBaseline = "middle";
        f.fillText(a, h / 2, d / 2);
        SCRIBL.chars.heights[d][a + "rightInsert"] = e;
        f.fillStyle = i;
        e = document.createElement("canvas");
        f = e.getContext("2d");
        f.font = g + "px courier";
        e.height = d;
        e.width = h;
        i = f.fillStyle;
        f.fillStyle = c;
        f.fillRect(0, 0, h, d);
        f.fillStyle = "yellow";
        f.beginPath();
        f.moveTo(h, d);
        f.arcTo(0, d, 0, 0, d / 2);
        f.lineTo(0, d);
        f.lineTo(h, d);
        f.closePath();
        f.fill();
        f.fillStyle = b;
        f.textAlign = "center";
        f.textBaseline = "middle";
        f.fillText(a, h / 2, d / 2);
        SCRIBL.chars.heights[d][a + "leftInsert"] = e;
        f.fillStyle = i
    }
});
var Line = Glyph.extend({
    init: function (a, b, c, d) {
        this.thickness = 2;
        this._super(a, b, c, void 0, d);
        this.glyphType = "Line"
    },
    _draw: function (a, b, c) {
        a = a || this.ctx;
        b = b || this.getPixelLength();
        c = c || this.getHeight();
        x = y = 0;
        a.beginPath();
        a.moveTo(x, c / 2 - this.thickness / 2);
        a.lineTo(x, c / 2 + this.thickness / 2);
        a.lineTo(x + b, c / 2 + this.thickness / 2);
        a.lineTo(x + b, c / 2 - this.thickness / 2)
    }
});
var Complex = Glyph.extend({
    init: function (a, b, c, d, e, f) {
        this._super(a, b, c, d, f);
        this.slope = 1;
        this.glyphType = "Complex";
        this.subFeatures = e;
        this.line = new Line(a, 0, c);
        this.line.parent = this;
        this.line.color = "black";
        this.line.thickness = 2
    },
    addSubFeature: function (a) {
        this.subFeatures.push(a)
    },
    _draw: function (a, b, c, d) {
        a = a || this.ctx;
        b || this.getPixelLength();
        c || this.getHeight();
        d + 1 || this.calcRoundness();
        x = y = 0;
        a.translate(-this.getPixelPositionX(), 0);
        this.line.lane = this.lane;
        this.line.draw();
        b = this.subFeatures.length;
        for (c = 0; c < b; c++) this.subFeatures[c].parent = this, this.subFeatures[c].lane = this.lane, this.subFeatures[c].draw();
        a.translate(this.getPixelPositionX(), 0);
        a.beginPath()
    }
});
var Arrow = Glyph.extend({
    init: function (a, b, c, d) {
        this._super(a, b, 0, c, d);
        this.slope = 1;
        this.glyphType = "Arrow";
        this.thickness = 4.6
    },
    getPixelThickness: function () {
        return this.thickness / 10 * (this.getHeight() / 2 / Math.tan(Math.atan(this.slope)))
    },
    erase: function () {
        var a = this.getPixelThickness();
        this.ctx.clearRect(-a, 0, a, this.getHeight())
    },
    _draw: function (a, b, c, d) {
        a = a || this.ctx;
        c = c || this.getHeight();
        d = d + 1 || this.calcRoundness();
        d != void 0 && (d -= 1);
        b = this.getPixelThickness();
        x = y = 0;
        a_b_x = x - 0 - d;
        a_t_x = x - 0 - d;
        a_max_x = x - 0;
        t = 0.5;
        a_ctrl_x = (a_max_x - (1 - t) * (1 - t) * a_b_x - t * t * a_t_x) / (2 * (1 - t) * t);
        a_ctrl_y = y + c / 2;
        bs_slope = this.slope;
        bs_intercept = -a_ctrl_y - bs_slope * a_ctrl_x;
        ts_slope = -this.slope;
        ts_intercept = -a_ctrl_y - ts_slope * a_ctrl_x;
        a_b_y = -(bs_slope * a_b_x + bs_intercept);
        a_t_y = -(ts_slope * a_t_x + ts_intercept);
        a.beginPath();
        bs_ctrl_y = y + c;
        bs_ctrl_x = (-bs_ctrl_y - bs_intercept) / this.slope;
        bs_slpe_x = bs_ctrl_x + d + d;
        bs_slpe_y = -(bs_slope * bs_slpe_x + bs_intercept);
        a.moveTo(bs_slpe_x, bs_slpe_y);
        a.lineTo(a_b_x, a_b_y);
        a.quadraticCurveTo(a_ctrl_x,
        a_ctrl_y, a_t_x, a_t_y);
        ts_ctrl_y = y;
        ts_ctrl_x = (ts_ctrl_y + ts_intercept) / this.slope;
        ts_slpe_x = ts_ctrl_x + d + d;
        ts_slpe_y = -(ts_slope * ts_slpe_x + ts_intercept);
        a.lineTo(ts_slpe_x, ts_slpe_y);
        var e = Math.PI - Math.abs(Math.atan(this.slope)) - Math.PI / 2;
        d = Math.sin(e) * b;
        e = Math.cos(e) * b;
        a.bezierCurveTo(ts_ctrl_x, ts_ctrl_y, ts_ctrl_x - d, ts_ctrl_y + e, ts_slpe_x - d, ts_slpe_y + e);
        a.lineTo(a_max_x - b, y + c / 2);
        a.lineTo(bs_slpe_x - d, bs_slpe_y - e);
        a.bezierCurveTo(bs_ctrl_x - d, bs_ctrl_y - e, bs_ctrl_x, bs_ctrl_y, bs_slpe_x, bs_slpe_y)
    }
});

function genbank(a, b) {
    for (var c = a.split("\n"), d = RegExp(/\s+gene\s+([a-z]*)\(?(\d+)\.\.(\d+)/), e = [], f = void 0, g = void 0, h = 0; h < c.length; h++) {
        var i;
        if (i = c[h].match(d)) {
            i.shift();
            e.push(i);
            var k = i[2];
            if (f == void 0 || f > k) f = k;
            i = i[1];
            if (g == void 0 || g < i) g = i
        }
    }
    b.scale.max = f;
    b.scale.min = g;
    for (c = 0; c < e.length; c++) d = "+", e[c][0] == "complement" && (d = "-"), i = e[c][1], k = e[c][2], i = i - 1 + 1, b.addGene(i, k - i, d)
};

function bed(a, b) {
    var c = a.split("\n");
    numFeatures = c.length;
    for (var d = 1; d < numFeatures; d++) {
        if (c[d] == "") break;
        var e = c[d].split(" "),
            f = parseInt(e[1]),
            g = parseInt(e[2]),
            h = e[0] + ": " + e[3],
            i = e[5],
            k = e[8],
            l = e[10].split(",");
        e = e[11].split(",");
        f = b.addFeature(new Complex("complex", f, g, i, [], {
            color: k,
            name: h
        }));
        for (g = 0; g < l.length; g++) {
            if (l[g] == "") break;
            f.addSubFeature(new BlockArrow("complex", parseInt(e[g]), parseInt(l[g]), i))
        }
    }
};