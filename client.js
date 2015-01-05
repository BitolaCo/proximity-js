/*! This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/*! Lazy-loading of images based on lazyload.js (c) Lorenzo Giuliani
 * MIT License (http://www.opensource.org/licenses/mit-license.html) */
 (function(w) {

    /**

     *
     * Expects:
     * `<img src="blank.gif" data-src="my-image.png" data-bg="my-image.png" data-ratio="2:1" class="optimized">`
     */
    function Proximity(settings) {

        var self = this,
            cl = settings && settings.cl || "optimized";

        this.images = [];
        this.settings = {
            proxy: settings && settings.proxy || false,
            WebP: false,
            forceRatio: settings && settings.forceRatio || false,
            cl: cl,
            lazyCl: settings && settings.lazyCl || cl,
            resizeCl: settings && settings.resizeCl || cl
        };

        this.handleVisibility = function() {

            if (! self.images || ! self.images.length) {
                w.removeEventListener("scroll", self.handleVisibility);
            }

            for (var i = 0; i < self.images.length; i++) {
                var img = self.images[i];
                if (self.elementInViewport(img)) {
                    self.loadImage(img, function () {
                        // Since images are loaded in an async way,
                        // we can't depend on the previous index to remove it
                        // from the "stack", so we need to loop through all the
                        // images again.
                        for (var i = 0; i < self.images.length; i++) {
                            if (img === self.images[i]) {
                                self.images.splice(i, 1);
                            }
                        }
                    });
                }
            }

        };

        // Always test for WebP.
        function testWebP(callback) {
            var webP = new Image();
            webP.onload = webP.onerror = function () {
                callback(webP.height == 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        }

        testWebP(function(support) {
            self.settings.WebP = support;
        });

    }

    Proximity.prototype.setWebPSrc = function(src) {
        return src.replace(/\.(png|jpe?g|gif)/gi, ".$1.webp")
    };

    Proximity.prototype.loadImage = function(el, fn) {

        var self = this,
            img = new Image(),
            src = el.getAttribute("data-src"),
            bg = el.getAttribute("data-bg");

        // Loading an image.
        if (src) {
            if (self.settings.WebP) {
                src = this.setWebPSrc(src);
            }
            img.onload = function () {
                if (!! el.parent) {
                    el.parent.replaceChild(img, el)
                } else {
                    el.src = src;
                }
                // This removes the preset ratio if desired, to allow a "natural" height.
                if (! self.settings.forceRatio) {
                    el.style.height = "auto";
                }
                fn && "function" === typeof fn ? fn() : null;
            };

            img.src = this.getImgSrc(src, el.offsetWidth);
        }

        // Loading a background.
        if (bg) {
            if (this.settings.WebP) {
                bg = this.setWebPSrc(bg);
            }
            el.style.backgroundImage = "url(" + this.getImgSrc(bg, el.offsetWidth) + ")";
        }

    };

    Proximity.prototype.getImgSrc = function(src, width) {

        if (! this.settings.proxy) {
            return src;
        }

        return ["/", this.settings.proxy, width, src].join("/");

    };

    Proximity.prototype.elementInViewport = function(el) {
        var rect = el.getBoundingClientRect();
        return (
            rect.top >= 0
            && rect.left >= 0
            && rect.top <= (w.innerHeight || document.documentElement.clientHeight)
        );
    };

    Proximity.prototype.imgSetHeight = function(img) {

        var width = img.offsetWidth,
            ratio = img.getAttribute("data-ratio")
                ? img.getAttribute("data-ratio")
                : 1;

        // Set the proper height.
        if (ratio !== 1) {
            var r = ratio.split(":");
            if(r.length > 1) {
                ratio = parseFloat(r[1] || 1) / parseFloat(r[0] || 1);
            }
        }

        img.style.height = (width * ratio) + "px";

    };

    Proximity.prototype.init = function() {

        var query = document.querySelectorAll("." + this.settings.cl);
        for (var i = 0; i < query.length; i++) {
            this.imgSetHeight(query[i]);
            this.images.push(query[i]);
        }

        w.addEventListener("scroll", this.handleVisibility);
        this.handleVisibility();

        return this;

    };

    if("function" === typeof define) {
        define("proximity", Proximity)
    } else {
        w.Proximity = Proximity;
    }

}(window));