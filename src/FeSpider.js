/**
* @Author: Ke Shen <godzilla>
* @Date:   2017-03-10 09:43:57
* @Email:  keshen@sohu-inc.com
* @Last modified by:   godzilla
* @Last modified time: 2017-03-10 09:43:57
*/

(function () {

    var conf = {
        fetchFont: false
    };

    /**
     * String Hash
     * Ref: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
     */
    String.prototype.hashCode = function () {
        var hash = 0, i, chr;
        if (this.length === 0) return hash;
        for (i = 0; i < this.length; i++) {
            chr   = this.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    var getFontFaces = function () {
        var re = [],
            o = {},
            sheet = document.styleSheets,
            rule = null,
            i = sheet.length, j;
        while (0 <= --i) {
            rule = sheet[i].rules || sheet[i].cssRules || [];
            j = rule.length;
            while (0 <= --j) {
                if (rule[j].constructor.name === 'CSSFontFaceRule') { // rule[j].cssText.slice(0, 10).toLowerCase() === '@font-face'
                    re.push(rule[j].cssText);
                    o[rule[j].style.fontFamily] = rule[j].style.src;
                };
            }
        }
        return re;
    };

    var PropertyTable = {
        'display': {},
        'flex': {},
        'position': {},
        'z-index': {},
        'width': {},
        'height': {},
        'top': {},
        'right': {},
        'bottom': {},
        'left': {},
        'background': {},
        'background-color': {},
        'background-size': {},
        'margin': {},
        // 'margin-top': {},
        // 'margin-right': {},
        // 'margin-bottom': {},
        // 'margin-left': {},
        'padding': {},
        // 'padding-top': {},
        // 'padding-right': {},
        // 'padding-bottom': {},
        // 'padding-left': {},
        'border': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-top': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-right': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-bottom': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-left': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'border-radius': {},
        'border-collapse': {
            inherit: true
        },
        'border-spacing': {
            inherit: true
        },
        'box-shadow': {},
        'box-sizing': {},
        'outline': {
            ignore: function (v) {
                return v.indexOf('none') >= 0;
            }
        },
        'color': {
            inherit: true
        },
        'text-align': {
            inherit: true
        },
        'text-indent': {
            inherit: true
        },
        'overflow': {},
        'clear': {},
        'cursor': {
            inherit: true
        },
        'float': {},
        'font': {
            inherit: true
        },
        'font-family': {
            inherit: true
        },
        'font-size': {
            inherit: true
        },
        'font-weight': {
            inherit: true
        },
        'letter-spacing': {
            inherit: true
        },
        'line-height': {
            inherit: true
        },
        'list-style': {
            inherit: true
        },
        'max-width': {},
        'min-width': {},
        'max-height': {},
        'min-height': {},
        'opacity': {},
        'visibility': {
            inherit: true
        },
        'text-decoration': {},
        'transform': {},
        'transition': {},
        'vertical-align': {},
        'white-space': {
            inherit: true
        },
        'word-break': {},
        'word-wrap': {},
        'content': {}
    };

    var cleanComputedStyle = function (cs) {
        if (cs['border-top'] === cs['border']) delete cs['border-top'];
        if (cs['border-right'] === cs['border']) delete cs['border-right'];
        if (cs['border-bottom'] === cs['border']) delete cs['border-bottom'];
        if (cs['border-left'] === cs['border']) delete cs['border-left'];
    };

    var propNameCamelify = function (name) {
        var parts = name.split('-');
        var re = parts[0] || '';
        for (var i = 1, len = parts.length; i < len; i++) {
            var p = parts[1];
            re += p.substr(0, 1).toUpperCase() + p.substr(1);
        }
        return re;
    };

    var getFullStyle = function (dom, pseudo) {
        var cs = pseudo ? getComputedStyle(dom) : getComputedStyle(dom, ':' + pseudo);
        var ncs = (pseudo && !pseudoClassTable[pseudo].element) ? getComputedStyle(dom) 
            : getNodeDefaultCS((pseudo && pseudoClassTable[pseudo].element === 'inline') ? 'span' : dom.nodeName.toLowerCase());
        var re = {};
        for (var prop in PropertyTable) {
            var cprop = propNameCamelify(prop);
            if (cs[cprop] && (preventDefaultProps[dom.nodeName.toLowerCase() + ' ' + prop]
                || (cs[cprop] !== ncs[cprop] && (!PropertyTable[prop].ignore || !PropertyTable[prop].ignore(cs[cprop]))))) {
                re[prop] = cs[cprop];
            }
        }
        cleanComputedStyle(re);
        return re;
    };

    var pseudoClassTable = {
        'before': { element: 'inline' },
        'after': { element: 'inline' }
    };
    var getPseudoElements = function (dom, domStyle) {
        var re = {};
        for (var p in pseudoClassTable) {
            if (pseudoClassTable[p].element) {
                var cs = getComputedStyle(dom, ':' + p);
                if (cs.content) {
                    re[p] = getFullStyle(dom, p);
                }
            } else {
                var ps = getFullStyle(dom, p);
                var stylePatches = {};
                var diff = false;
                for (var i in domStyle) {
                    if (domStyle[i] !== ps[i]) {
                        stylePatches[i] = ps[i];
                        diff = true;
                    }
                }
                if (diff) {
                    re[p] = stylePatches;
                    console.log(stylePatches);
                }
            }
        }
        if (Object.keys(re).length === 0) return null;
        return re;
    };

    var preventDefaultProps = {
        'a color': true,
        'a text-decoration': true,
        'input outline': true,
        'input border': true,
        'textarea outline': true
    };

    var getMetaData = function (dom) {
        var metaShow = getFullMetaData(dom);
        dom.style.display = 'none';
        var metaHide = getFullMetaData(dom);
        var patch = function (node1, node2) {
            if (!node1.style) return;
            for (var p in node1.style) {
                if (/px/.test(node1.style[p])
                    && p !== 'transform' && p != 'transition') {
                    node1.style[p] = node2.style[p];
                    if (node1.style[p] === 'auto' || node1.style[p] === undefined) {
                        delete node1.style[p];
                    }
                }
            }
            if (node1.childNodes) {
                for (var i = 0, len = node1.childNodes.length; i < len; i++) {
                    patch(node1.childNodes[i], node2.childNodes[i]);
                }
            }
        };
        patch(metaShow, metaHide);
        return metaShow;
    };
    var getMetaData_test = function (dom) {
        var display = getComputedStyle(dom)['display'];
        dom.style.display = 'none';
        var re = getFullMetaData(dom);
        re.style.display = display;
        return re;
    };

    var getFullMetaData = function (dom) {
        var type = dom.nodeName.toLowerCase();
        if (type === 'meta') return null;
        if (type === '#comment') return null;
        if (type === '#text') {
            return {
                nodeName: '#text',
                value: dom.nodeValue
            };
        }
        var meta = {
            nodeName: type,
            style: getFullStyle(dom),
            attrs: {}
        };
        switch (type) {
            case 'a':
                var href = dom.getAttribute('href');
                var target = dom.getAttribute('target');
                var title = dom.getAttribute('title');
                if (href) meta.attrs.href = href;
                if (target) meta.attrs.target = target;
                if (title) meta.attrs.title = title;
                break;
            case 'img':
                var src = dom.getAttribute('src');
                if (src) meta.attrs.src = src;
                break;
        }
        if (Object.keys(meta.attrs).length === 0) {
            delete meta.attrs;
        }

        meta.pseudo = getPseudoElements(dom, meta.style);
        if (!meta.pseudo) delete meta.pseudo;

        if (dom.childNodes.length) {
            meta.childNodes = [];
            dom.childNodes.forEach(function (el, i) {
                var childData = getFullMetaData(el);
                if (!childData) return true;
                if (childData.nodeName !== '#text') {
                    var dupProps = [];
                    for (var i in childData.style) {
                        if (!preventDefaultProps[childData.nodeName + ' ' + i]
                            && PropertyTable[i].inherit
                            && meta.style[i] === childData.style[i]) {
                            dupProps.push(i);
                        }
                    }
                    dupProps.forEach(function (p) {
                        delete childData.style[p];
                    });
                }
                meta.childNodes.push(childData);
            });
        }

        return meta;
    };

    var nodeTypeCount = {};
    var cssRuleValueHash2Name = {};
    var cssRuleName2ValueHash = {};
    var stringOfStyleObj = function (obj) {
        var props = [];
        for (var p in obj) {
            props.push(p + ':' + obj[p] + ';');
        }
        return props.join('');
    };
    var addCssRule = function (nodeName, obj, pseudo) {
        var self = stringOfStyleObj(obj);
        var selfHash = self.hashCode();
        
        var pseudoValues = {};
        var pseudoHashes = {};
        if (pseudo) {
            for (var p in pseudo) {
                pseudoValues[p] = !pseudo[p] ? undefined : stringOfStyleObj(pseudo[p]);
                pseudoHashes[p] = pseudoValues[p] ? pseudoValues[p].hashCode() : undefined;
            }
        }

        if (cssRuleValueHash2Name[selfHash]) {
            var existingNameList = cssRuleValueHash2Name[selfHash];
            for (let existingName of existingNameList) {
                var consistent = true;
                for (var p in pseudoClassTable) {
                    if (cssRuleName2ValueHash[existingName + ':' + p] !== pseudoHashes[p]) {
                        consistent = false;
                        break;
                    }
                }
                if (consistent) {
                    return existingName;
                }
            }
        }
        
        if (!nodeTypeCount[nodeName]) nodeTypeCount[nodeName] = 0;
        nodeTypeCount[nodeName]++;
        var className = nodeName.toUpperCase() + nodeTypeCount[nodeName];
        
        if (!cssRuleValueHash2Name[selfHash]) cssRuleValueHash2Name[selfHash] = [];
        cssRuleValueHash2Name[selfHash].push(className);
        for (var p in pseudoHashes) {
            if (pseudoHashes[p]) cssRuleName2ValueHash[className + ':' + p] = pseudoHashes[p];
        }
        
        styleSheet.innerHTML += '.' + className + '{' + self + '}';
        for (var p in pseudoValues) {
            if (pseudoValues[p]) styleSheet.innerHTML += '.' + className + ':' + p + '{' + pseudoValues[p] + '}';
        }
        
        return className;
    };

    var helperIframe;

    var getNodeDefaultCS = function (nodeName) {
        var iframeId = 'qwe123';
        if (!helperIframe) {
            helperIframe = document.createElement('iframe');
            helperIframe.id = iframeId;
            document.body.appendChild(helperIframe);
        }
        var iframeDoc = helperIframe.contentDocument;
        var iframeNodes = iframeDoc.getElementsByTagName(nodeName);
        var node;
        if (iframeNodes.length) node = iframeNodes[0];
        else {
            node = iframeDoc.createElement(nodeName);
            iframeDoc.body.appendChild(node);
        }
        return getComputedStyle(node);
    };

    var buildDom = function (meta) {
        if (meta.nodeName === '#text') {
            return document.createTextNode(meta.value);
        }
        var dom = document.createElement(meta.nodeName);

        if (meta.attrs) {
            for (var k in meta.attrs) {
                dom.setAttribute(k, meta.attrs[k]);
            };
        }

        if (meta.childNodes) {
            meta.childNodes.forEach(function (child) {
                dom.appendChild(buildDom(child));
            });
        }

        dom.className = addCssRule(meta.nodeName, meta.style, meta.pseudo);

        return dom;
    };

    var styleSheet;

    var presentDom = function (dom) {
        var rootMeta = getMetaData(dom);
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        styleSheet = document.createElement('style');
        document.head.appendChild(styleSheet);

        document.body.appendChild(buildDom(rootMeta));
    };

    window.fespider = {
        getMetaData: getMetaData,
        present: presentDom
    };

})();