/*
 * Chameleon - jQuery plugin for colorize content
 *
 * Copyright (c) 2016 Vadim Fedorov
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *  http://vadimfedorov.ru/chameleon
 *
 */

;(function ($) {
    'use strict';

    $.bind = function (func, context) {
        var bindArgs = [].slice.call(arguments, 2);

        function wrapper() {
            var args = [].slice.call(arguments);
            var unshiftArgs = bindArgs.concat(args);
            return func.apply(context, unshiftArgs);
        }

        return wrapper;
    };


    $.setAttributes = function (el, attrs) {
        for (var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                el.setAttribute(key, attrs[key]);
            }
        }
        return el;
    };

    $.sortAssoc = function (aInput) {
        var aTemp = [];

        for (var sKey in aInput) {
            if (aInput.hasOwnProperty(sKey)) {
                aTemp.push([sKey, aInput[sKey]]);
            }
        }

        aTemp.sort(function () {
            return arguments[1][1] - arguments[0][1];
        });

        var aOutput = [];

        for (var nIndex = 0; nIndex < aTemp.length; nIndex += 1) {
            aOutput[aTemp[nIndex][0]] = aTemp[nIndex][1];
        }

        return aOutput;
    };

    $.decimalToHex = function (d, padding) {
        var hex = Number(d).toString(16);

        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    };

    $.hexToRGB = function (hex) {
        hex = hex.replace(/#/g, '');

        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16),
            lum: function () {
                return this.r + this.g + this.b;
            }
        };
    };

    $.lumDiff = function (firstRGB, secondRGB) {
        var L1 = 0.2126 * Math.pow(firstRGB.r / 255, 2.2) + 0.7152 * Math.pow(firstRGB.g / 255, 2.2) + 0.0722 *
                Math.pow(firstRGB.b / 255, 2.2),
            L2 = 0.2126 * Math.pow(secondRGB.r / 255, 2.2) + 0.7152 * Math.pow(secondRGB.g / 255, 2.2) + 0.0722 *
                Math.pow(secondRGB.b / 255, 2.2);

        return L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);
    };

    $.сolorLuminance = function (hex, lum) {
        hex = String(hex).replace(/[^0-9a-f]/gi, '');

        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        lum = lum || 0;

        var rgb = "#", c, i;

        for (i = 0; i < 3; i += 1) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    };

    $.findColor = function (back_RGB, front_RGB, front_HEX, want, limit) {
        var lum_color = '',
            lum = 0.05,
            lum_step = 1,
            good = 5,
            bad_color = false,
            end_color = '';

        while ($.lumDiff(back_RGB, front_RGB) < good) {
            lum_color = $.сolorLuminance(front_HEX, want * lum * lum_step);
            front_RGB = $.hexToRGB(lum_color);
            lum_step += 1;
            if (lum_step > limit) {
                break;
            }
        }

        bad_color = lum_step > limit;
        end_color = (want > 0) ? '#ffffff' : '#000000';

        return ( bad_color ) ? end_color : lum_color;
    };

    $.adaptColor = function (back_color, limit, color) {
        var back_RGB = $.hexToRGB(back_color),
            front_RGB = $.hexToRGB(color),
            good = 5,
            want = 1;

        if ($.lumDiff(back_RGB, front_RGB) >= good) {
            return '#' + color;
        } else {
            if ($.lumDiff(back_RGB, {r: 0, g: 0, b: 0}) >= good) {
                want = -1;
            }

            return $.findColor(back_RGB, front_RGB, color, want, limit);
        }
    };

    $.addAttrsToColorSpan = function (element, color, class_name) {
        color = '#' + color.replace(/#/g, '').toLowerCase();
        element.innerHTML = color;
        element.setAttribute("class", class_name + ' used_color label');
        element.title = '[Click] Go to ColorHexa (' + color + ')';
        element.style.backgroundColor = color;
        element.style.color = $.lumDiff($.hexToRGB(color), {r: 0, g: 0, b: 0}) >= 5 ? '#000000' : '#ffffff';
        element.onclick = function (e) {
            if (e.target !== this) {
                return false;
            }

            window.open('http://www.colorhexa.com/' + color.replace('#', ''), '_blank');

            return false;
        };
    };

    $.buildSpanColor = function (adapt_color, source_color, background) {
        var source_color_span = document.createElement("span"),
            adapt_color_span = document.createElement("span"),
            adapt_legend = document.createElement("span"),
            container = document.createElement("span"),
            is_different = source_color ? adapt_color.toLowerCase() !== '#' + source_color.toLowerCase() : 'false';

        $.addAttrsToColorSpan(adapt_color_span, adapt_color, '');

        if (source_color && is_different) {
            var action = ($.hexToRGB(source_color).lum() - $.hexToRGB(adapt_color).lum()) > 0 ? ' darken' : ' lighten';
            $.addAttrsToColorSpan(source_color_span, source_color, 'source_color');
            adapt_legend.innerHTML = '&nbsp;&#8594;&nbsp;';
            adapt_legend.setAttribute("class", "adapt_legend");
            adapt_legend.title = 'Color #' + source_color + action + ' to ' + adapt_color + ' for readability.';
            adapt_legend.style.color = $.lumDiff($.hexToRGB(background), { r: 0, g: 0, b: 0 }) >= 5 ? '#000000' : '#ffffff';
            adapt_color_span.className += ' adapt_color';
            container.appendChild(source_color_span);
            source_color_span.appendChild(adapt_legend);
        }

        container.appendChild(adapt_color_span);

        return container;
    };

    $.colorizeItem = function (item_elem, img, item_colors, settings) {
        'use strict';

        var element = item_elem || false;

        if (element) {
            var marks = [],
                background = item_colors[0] || settings.dummy_back,
                colors = ['#' + background],
                mark_amt_affix = 1;

            var tmp_marks = element.find('.chmln' + mark_amt_affix);

            while (tmp_marks.length > 0) {
                marks.push(tmp_marks);
                mark_amt_affix += 1;
                tmp_marks = element.find('.chmln' + mark_amt_affix);
            }

            while (item_colors.length < mark_amt_affix) {
                item_colors.push(settings.dummy_front);
            }

            if (settings.all_colors) {
                mark_amt_affix = item_colors.length;
            }

            if (settings.adapt_colors) {
                colors = colors.concat(
                    item_colors.slice(1, mark_amt_affix).map($.bind($.adaptColor, null, background, settings.adapt_limit))
                );
            } else {
                for (var m = 1; m < mark_amt_affix; m += 1) {
                    colors.push('#' + item_colors[m]);
                }
            }

            var j = 0, apply = settings.apply_colors;

            if (apply) {
                element.css('background-color', '#' + background);
            }

            for (var i = 0; i < marks.length; i += 1) {
                j += 1;

                if (apply) {
                    marks[i].css('color', colors[j]);

                    for (var l = 0; l < marks[i].length; l += 1) {
                        if (settings.rules.hasOwnProperty(marks[i][l].nodeName)) {
                            var rules = settings.rules[marks[i][l].nodeName].split(','), length = rules.length;
                            for (var k = 0; k < length; k += 1) {
                                marks[i][l].style[rules[k].replace(/\s/g, '')] = colors[j];
                            }
                        }
                    }
                }

                if (settings.insert_colors) {
                    if (i === 0) {
                        var colors_container = element.find('.chmln_colors')[0];
                        if (colors_container) {
                            colors_container.innerHTML = '';
                        } else {
                            colors_container = $.setAttributes(document.createElement("div"), {'class': 'chmln_colors'});
                            element.append(colors_container);
                        }
                        colors_container.appendChild($.buildSpanColor('#' + background));
                    }
                    colors_container.appendChild($.buildSpanColor(colors[j], item_colors[j], background));
                }
            }
        }

        return colors;
    };

    $.fn.chameleon = function (options, callback) {
        var $cur_elem = $(this);

        if (!$cur_elem.length) {
            $.error('Chameleon.js: .chmln-container not found, probably, bad selector.');
        }

        var settings = $.extend({
            img: $cur_elem.find('.chmln_img').first(),
            dummy_back: 'ededef',
            dummy_front: '4f5155',
            adapt_colors: true,
            apply_colors: true,
            data_colors: false,
            insert_colors: false,
            all_colors: false,
            rules: {},
            adapt_limit: 200,
            alpha: 200
        }, options || {});

        if (settings.img.length > 0) {
            var canvas = document.getElementById('chmln_canvas') ?
                document.getElementById('chmln_canvas') :
                document.createElement("canvas");

            this.length === 1 ? this.append(canvas) : this[0].appendChild(canvas);
            var ctx = canvas.getContext("2d");
            $.setAttributes(canvas, {'width': 1000, 'height': 1000, 'id': 'chmln_canvas', 'style': 'display:none;'});
            ctx.clearRect(0, 0, 1000, 1000);

            this.each(function (index) {
                var $this = $(this), colors = [], item_colors = [], img = new Image();

                img.onload = function () {

                    ctx.width = img.width;
                    ctx.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    var imgd = ctx.getImageData(0, 0, img.width, img.height), pix = imgd.data, color_string = '';

                    for (var i = 0; i < pix.length; i += 4) {
                        if (pix[i + 3] > settings.alpha) {
                            color_string = pix[i] + ',' + pix[i + 1] + ',' + pix[i + 2] + ',' + pix[i + 3];
                            colors[color_string] ? colors[color_string] += 1 : colors[color_string] = 1;
                        }
                    }

                    var sorted_colors = $.sortAssoc(colors),
                        dev_val = 30,
                        used_colors = [],
                        is_valid = false;

                    for (var clr in sorted_colors) {
                        if (sorted_colors.hasOwnProperty(clr)) {
                            var color_values = clr.split(','), hex_val = '';

                            is_valid = true;

                            for (var k = 0; k < 3; k += 1) {
                                hex_val += $.decimalToHex(color_values[k], 2);
                            }

                            for (var l = 0; l < used_colors.length; l += 1) {
                                var color_dev_ttl = 0,
                                    rgba_vals = used_colors[l].split(',');

                                for (var m = 0; m < 3; m += 1) {
                                    color_dev_ttl += Math.abs(color_values[m] - rgba_vals[m]);
                                }

                                if (color_dev_ttl / 4 < dev_val) {
                                    is_valid = false;

                                    break;
                                }
                            }

                            if (is_valid) {
                                used_colors.push(clr);
                                item_colors.push(hex_val);
                            }
                        }
                    }

                    colors = $.colorizeItem($this, settings.img[index], item_colors, settings);

                    if (settings.data_colors) {
                        $.setAttributes($this[0], {'data-colors': colors});
                    }

                    if (typeof callback === 'function') {
                        callback(colors);
                    }
                };

                img.onerror = function () {
                    if (typeof callback === 'function') {
                        callback(colors);
                    }

                    $.error('Chameleon.js: Failed to load resource. URL - ' + img.src);
                };

                img.src = (typeof settings.img === 'object') ? settings.img[index].src : settings.img;
            });
        } else {
            $.error('Chameleon.js: Image not found. Each individual material must contain at least one image.');
        }
        return this;
    };
})(jQuery);